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
    // For the "Sale" badge / offers page: on sale whenever this is set and
    // greater than `price` — the storefront derives "on sale" from these
    // two fields directly rather than a separate time-boxed Offer record.
    compareAtPrice: {
      type: Number,
      min: 0
    },
    gender: {
      type: String,
      enum: shopGenderEnum,
      required: true
    },
    // A product can belong to more than one collection (e.g. "summer" and
    // "daily" at once), so this is a many-to-many ref, not a single parent.
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
    // Named `newArrival` (not `isNew`) because `isNew` is a reserved
    // Mongoose document property (tracks whether the doc has been
    // persisted yet) — reusing that name would silently collide with it.
    // The API still exposes this as `isNew` to match the frontend's type.
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

// `inStock` is derived from `stockQuantity` rather than stored twice, so
// the two can never fall out of sync — the API layer includes it in every
// response the same way the frontend's mock Product objects already do.
productSchema.virtual("inStock").get(function () {
  return this.stockQuantity > 0;
});
productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

const productModel = mongoose.models.Product || mongoose.model("Product", productSchema);

export default productModel;
