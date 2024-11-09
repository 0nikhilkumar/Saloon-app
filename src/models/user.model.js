import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      index: true,
    },
    
    username: {
      type: String,
      unique: true,
      lowercase: true,
      required: true,
      trim: true,
      index: true,
    },

    email: {
      type: String,
      lowercase: true,
      unique: true,
      required: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    phoneNumber: {
      type: String,
    },

    profileImageUrl: {
      type: String,
    },

    gender: {
      type: String,
      enum: ["Male", "Female"]
    },

    location: {
      address: { type: String },
      latitude: {type: String},
      longitude: {type: String},
    },

    verifyCode: {
      type: String,
      required: [true, "Verify Code is required"],
    },

    verifyCodeExpiry: {
      type: Date,
      required: [true, "Verify Code Expiry is required"],
    },

    token: { type: String },

    isVerified: { type: Boolean, default: false },

    role: {
      type: String,
      enum: ["User", "Partner"],
      default: "User"
    },
  },
  { timestamps: true });

userSchema.pre('save', async function (next){
  if(!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});


userSchema.methods.isCorrectPassword = async function(password){
  return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateToken = function (){
  return jwt.sign({
    _id: this._id,
    email: this.email,
    username: this.username,
    fullname: this.fullname
  }, process.env.TOKEN_SECRET, {expiresIn: process.env.TOKEN_EXPIRY});
}

const User = mongoose.model("User", userSchema);
export default User;