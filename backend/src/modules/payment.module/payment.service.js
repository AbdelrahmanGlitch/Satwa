import { customAlphabet } from "nanoid";
import { asyncHandler } from "../../utils/errorHandling.js";
import orderModel from "../../DB/models/order.model.js";
import productModel from "../../DB/models/product.model.js";

// ---------------- reference number generator ------------------

const generateReference = customAlphabet("1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ", 16);

// -------------------- confirmFakePayment ----------------------

export const confirmFakePayment = asyncHandler(async (req, res, next) => {
    const { sessionToken, outcome } = req.body;
    const order = await orderModel.findOne({ paymentSessionToken: sessionToken });
    if (!order) {
        return next(new Error("Payment session not found", { cause: 404 }));
    }
    if (order.paymentStatus !== "pending") {
        return next(new Error(`This payment was already paid (${order.paymentStatus})`, { cause: 409 }));
    }

    if (outcome === "success") {
        order.paymentStatus = "paid";
        order.status = "processing";
        order.paidAt = new Date();
        order.paymentReference = `FAKE-${generateReference()}`;
        await order.save();
        return res.status(200).json({ message: "Payment confirmed", order });
    }

    order.paymentStatus = "failed";
    order.status = "cancelled";
    await order.save();
    for (const stock of order.products) {
        await productModel.updateOne({ _id: stock.product }, { $inc: { stockQuantity: stock.quantity } });
    }
    return res.status(200).json({ message: "Payment failed", order });
});
