import mongoose from "mongoose";

// A user's own gender (kept separate from shopGenderEnum below — these are
// two different concepts that used to incorrectly share one enum).
export const genderEnum = ["Male", "Female"];

// Which storefront line a Category/Product belongs to — matches the
// frontend's `Gender` type ("men" | "women") exactly.
export const shopGenderEnum = ["men", "women"];

const categorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    // Unique per gender (e.g. "summer" exists once for men, once for women)
    // — this is what the frontend's mega-menu and collection pages link to.
    slug: {
      type: String,
      required: true,
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
    gender: {
      type: String,
      enum: shopGenderEnum,
      required: true
    },
    // Optional: the current admin UI doesn't collect one yet.
    coverImage: {
      secure_url: { type: String },
      public_id: { type: String }
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin"
    }
  },
  { timestamps: true }
);

categorySchema.index({ gender: 1, slug: 1 }, { unique: true });

const categoryModel = mongoose.models.Category || mongoose.model("Category", categorySchema);

export default categoryModel;
