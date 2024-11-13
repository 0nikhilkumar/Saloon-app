import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema(
  {
    token: { type: String },
  },
  { timestamps: true }
);

export const Token = mongoose.model("Token", tokenSchema);