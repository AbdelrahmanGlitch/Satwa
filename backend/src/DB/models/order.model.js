import mongoose from "mongoose";

const orderStatusEnum = ["pending", "processing", "shipped", "delivered", "cancelled"];
const paymentStatusEnum = ["pending", "paid", "failed"];

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    products: [{
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      unitPrice: {
        type: Number,
        required: true
      }
    }],
    totalAmount: {
      type: Number,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: orderStatusEnum,
      default: "pending"
    },
    paymentMethod: {
      type: String,
      default: "fake_gateway"
    },
    paymentStatus: {
      type: String,
      enum: paymentStatusEnum,
      default: "pending"
    },
    paymentSessionToken: {
      type: String
    },
    paymentReference: {
      type: String
    },
    paidAt: {
      type: Date
    }
  },
  { timestamps: true }
);

const orderModel = mongoose.models.Order || mongoose.model("Order", orderSchema);

export default orderModel;
