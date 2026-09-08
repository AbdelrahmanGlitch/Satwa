import mongoose from "mongoose";

export const genderEnum = ["Male", "Female"];

export const shopGenderEnum = ["men", "women"];

const categorySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
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
