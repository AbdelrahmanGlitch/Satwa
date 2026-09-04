import mongoose from "mongoose";

const offerSchema = new mongoose.Schema({
  newPrice: {
    type: Number,
    required: true
  },
  // Snapshot of the product's price at the moment the offer was applied —
  // set by the server, never by the client — so removing/expiring the
  // offer can restore it exactly instead of guessing.
  originalPrice: {
    type: Number,
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category"
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  }
}, { timestamps: true });

const offerModel = mongoose.models.Offer || mongoose.model("Offer", offerSchema);

export default offerModel;