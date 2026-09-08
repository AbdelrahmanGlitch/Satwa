import { customAlphabet } from "nanoid";
import { asyncHandler } from "../../utils/errorHandling.js";
import orderModel from "../../DB/models/order.model.js";
import productModel from "../../DB/models/product.model.js";

// --------------- payment session token generator ----------------
const generateSessionToken = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyz", 24);

// ------------------------- stock update -------------------------

const reStock = async (items) => {
    const orderd = [];
    for (const item of items) {
        const updatedStock = await productModel.findOneAndUpdate(
            { _id: item.productId, stockQuantity: { $gte: item.quantity } },
            { $inc: { stockQuantity: -item.quantity } },
            { new: true }
        );
        if (!updatedStock) {
            for (const stock of orderd) {
                await productModel.updateOne({ _id: stock.productId }, { $inc: { stockQuantity: stock.quantity } });
            }
            const product = await productModel.findById(item.productId);
            if (!product) {
                throw new Error(`Product ${item.productId} not found`, {cause: 404})
            }
            throw new Error(`Not enough stock for "${product.name}" (${product.stockQuantity} left)`,{cause: 409})
        }
        orderd.push({ productId: item.productId, quantity: item.quantity, product: updatedStock });
    }
    return orderd;
};

// ----------------------------- checkout -----------------------------

export const checkout = asyncHandler(async (req, res, next) => {
    const { items, phone, address } = req.body;

    let stockUpdate;
    try {
        stockUpdate = await reStock(items);
    } catch (err) {
        return next(err);
    }

    const products = stockUpdate.map((info) => ({
        product: info.productId,
        quantity: info.quantity,
        unitPrice: info.product.price
    }));
    const totalAmount = products.reduce((sum, price) => sum + price.unitPrice * price.quantity, 0);

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
            checkoutUrl: `/checkout/fake?session=${order.paymentSessionToken}`
        }
    });
});

// ----------------------------- getMyOrders -----------------------------

export const getMyOrders = asyncHandler(async (req, res, next) => {
    const orders = await orderModel.find({ user: req.user._id }).populate("products.product").sort({ createdAt: -1 });
    return res.status(200).json({ message: "orders", orders });
});

// ----------------------------- getOrderById -----------------------------

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

// ----------------------------- getAllOrders -----------------------------

export const getAllOrders = asyncHandler(async (req, res, next) => {
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

// ----------------------------- updateOrderStatus -----------------------------

export const updateOrderStatus = asyncHandler(async (req, res, next) => {
    const order = await orderModel.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!order) {
        return next(new Error("Order not found", { cause: 404 }));
    }
    return res.status(200).json({ message: "Order status updated", order });
});
