import { customAlphabet } from "nanoid";
import { asyncHandler } from "../../utils/errorHandling.js";
import orderModel from "../../DB/models/order.model.js";
import productModel from "../../DB/models/product.model.js";

const generateSessionToken = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 24);

/**
 * Atomically decrements stock for every line item, one at a time, so two
 * simultaneous checkouts can never both succeed against the last unit of
 * the same product. If any line can't be reserved, everything already
 * decremented in this call is put back before the error surfaces.
 */
const reserveStock = async (items) => {
    const reserved = [];
    for (const item of items) {
        const updated = await productModel.findOneAndUpdate(
            { _id: item.productId, stockQuantity: { $gte: item.quantity } },
            { $inc: { stockQuantity: -item.quantity } },
            { new: true }
        );
        if (!updated) {
            for (const r of reserved) {
                await productModel.updateOne({ _id: r.productId }, { $inc: { stockQuantity: r.quantity } });
            }
            const product = await productModel.findById(item.productId);
            if (!product) {
                const err = new Error(`Product ${item.productId} not found`);
                err.cause = 404;
                throw err;
            }
            const err = new Error(`Not enough stock for "${product.name}" (${product.stockQuantity} left)`);
            err.cause = 409;
            throw err;
        }
        reserved.push({ productId: item.productId, quantity: item.quantity, product: updated });
    }
    return reserved;
};

export const checkout = asyncHandler(async (req, res, next) => {
    const { items, phone, address } = req.body;

    let reserved;
    try {
        reserved = await reserveStock(items);
    } catch (err) {
        return next(err);
    }

    const products = reserved.map((r) => ({
        product: r.productId,
        quantity: r.quantity,
        unitPrice: r.product.price
    }));
    const totalAmount = products.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0);

    const order = await orderModel.create({
        user: req.user._id,
        products,
        totalAmount,
        phone,
        address,
        paymentSessionToken: generateSessionToken()
    });

    return res.status(201).json({
        message: "Order created — proceed to fake payment to confirm it",
        order,
        payment: {
            sessionToken: order.paymentSessionToken,
            // Fake gateway "page" — nothing real is hosted here, it's just
            // a token the frontend hands back to /payment/fake/confirm.
            checkoutUrl: `/checkout/fake?session=${order.paymentSessionToken}`
        }
    });
});

export const getMyOrders = asyncHandler(async (req, res, next) => {
    const orders = await orderModel.find({ user: req.user._id }).populate("products.product").sort({ createdAt: -1 });
    return res.status(200).json({ message: "orders", orders });
});

export const getOrderById = asyncHandler(async (req, res, next) => {
    const order = await orderModel.findById(req.params.id).populate("products.product").populate("user", "name email");
    if (!order) {
        return next(new Error("Order not found", { cause: 404 }));
    }
    const isOwner = String(order.user?._id || order.user) === String(req.user._id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
        return next(new Error("Access Denied", { cause: 403 }));
    }
    return res.status(200).json({ message: "order", order });
});

export const listAllOrders = asyncHandler(async (req, res, next) => {
    const { status } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 24);
    const filter = status ? { status } : {};

    const [orders, total] = await Promise.all([
        orderModel.find(filter).populate("user", "name email").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
        orderModel.countDocuments(filter)
    ]);

    return res.status(200).json({ message: "orders", orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const updateOrderStatus = asyncHandler(async (req, res, next) => {
    const order = await orderModel.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!order) {
        return next(new Error("Order not found", { cause: 404 }));
    }
    return res.status(200).json({ message: "Order status updated", order });
});
