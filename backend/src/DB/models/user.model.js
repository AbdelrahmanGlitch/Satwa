import mongoose from "mongoose";
import { genderEnum } from "./category.model.js";

const providerEnum = ["local", "google"];

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: function () {
      return this.provider === "local";
    }
  },
  provider: {
    type: String,
    enum: providerEnum,
    default: "local"
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  // avatar is the google image if found
  avatar: {
    type: String
  },
  address: {
    type: String
  },
  phone: {
    type: String,
    required: function () {
      return this.provider === "local";
    }
  },
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  }],
  confirmed: {
    type: Boolean,
    default: false
  },
  gender: {
    type: String,
    enum: genderEnum,
    required: function () {
      return this.provider === "local";
    }
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  OTP: {
    type: String,
  },
  forgetPasswordOTP: {
    type: String,
  },
  pendingEmail: {
    type: String
  }
}, { timestamps: true });

const userModel = mongoose.models.User || mongoose.model("User", userSchema);

export default userModel;
