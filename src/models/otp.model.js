import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    verifyCode: {
      type: String,
      required: [true, "Verify Code is required"],
    },
    verifyCodeExpiry: {
      type: Date,
      required: [true, "Verify Code Expiry is required"],
    },
    status: {
      type: String
    },
    otpVerfied: {type: Boolean, default: false},
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "User"}
}, {timestamps: true});

export const Otp = mongoose.model("Otp", otpSchema);