import mongoose from "mongoose";
import { shopGenderEnum } from "./category.model.js";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    tagline: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    compareAtPrice: {
      type: Number,
      min: 0
    },
    gender: {
      type: String,
      enum: shopGenderEnum,
      required: true
    },
    collections: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    }],
    notes: {
      top: { type: [String], default: [] },
      heart: { type: [String], default: [] },
      base: { type: [String], default: [] }
    },
    images: [{
      secure_url: { type: String, required: true },
      public_id: { type: String, required: true }
    }],
    volumeMl: {
      type: Number,
      required: true,
      default: 100
    },
    stockQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    bestSeller: {
      type: Boolean,
      default: false
    },
    newArrival: {
      type: Boolean,
      default: false
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin"
    }
  },
  { timestamps: true }
);

productSchema.virtual("inStock").get(function () {
  return this.stockQuantity > 0;
});
productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

const productModel = mongoose.models.Product || mongoose.model("Product", productSchema);

export default productModel;
