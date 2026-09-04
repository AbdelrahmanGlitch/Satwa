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
  // Only local accounts have a password to hash; a Google account has
  // nothing to check it against, so it's required conditionally.
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
  avatar: {
    type: String
  },
  address: {
    type: String
  },
  // Google never hands over a phone number, so it can't be required for
  // every account up front — Google sign-ins fill it in later via
  // updateProfile.
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
  // Holds the new address while a profile email change waits on OTP
  // confirmation — `email` itself only changes once that code checks out,
  // so a user who never confirms keeps signing in with the old address
  // and no one else can be locked out of the new one in the meantime.
  pendingEmail: {
    type: String
  }
}, { timestamps: true });

const userModel = mongoose.models.User || mongoose.model("User", userSchema);

export default userModel;
