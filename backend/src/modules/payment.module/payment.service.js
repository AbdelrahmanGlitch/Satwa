import { customAlphabet } from "nanoid";
import { asyncHandler } from "../../utils/errorHandling.js";
import orderModel from "../../DB/models/order.model.js";
import productModel from "../../DB/models/product.model.js";

const generateReference = customAlphabet("1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ", 16);

/**
 * Stands in for a real payment gateway's redirect-back / webhook: the
 * frontend's fake checkout page calls this with the session token from
 * order.checkout and a chosen outcome, and that's treated exactly like a
 * gateway telling us the payment succeeded or was declined. No card data,
 * no external call — purely for demoing the full order lifecycle.
 */
export const confirmFakePayment = asyncHandler(async (req, res, next) => {
    const { sessionToken, outcome } = req.body;
    const order = await orderModel.findOne({ paymentSessionToken: sessionToken });
    if (!order) {
        return next(new Error("Payment session not found", { cause: 404 }));
    }
    if (order.paymentStatus !== "pending") {
        return next(new Error(`This payment session was already resolved (${order.paymentStatus})`, { cause: 409 }));
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
    // Declined payment — give the reserved stock back.
    for (const line of order.products) {
        await productModel.updateOne({ _id: line.product }, { $inc: { stockQuantity: line.quantity } });
    }
    return res.status(200).json({ message: "Payment failed", order });
});
