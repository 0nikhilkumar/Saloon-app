import crypto from "crypto";
import User from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import sendingOTP from "../utils/resend.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const generateToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const token = await user.generateToken();
        user.token = token;
        await user.save({validateBeforeSave: false});
        return { token };
    } catch (error) {
        console.log("Generate token Internal Error");
    }
};

export const register = asyncHandler(async (req, res)=> {
    const {username, email, password} = req.body;
    if(!username || !email || !password) {
        return res.status(400).json(new ApiResponse(400, "Please fill all the fields"))
    }

    const existingUserVerifiedByUsername = await User.findOne({
        username,
        isVerified: true,
    });

    if(existingUserVerifiedByUsername){
        return res.status(400).json(new ApiResponse(409, "Username is already taken"));
    }

    const verifyCode = crypto.randomInt(100000, 999999).toString();
    const existingUserByEmail = await User.findOne({email});

    

    if(existingUserByEmail){
        if(existingUserByEmail.isVerified){
            return res.status(400).json(new ApiResponse(400, "User already exists with this email"));
        }
        else{
            // const hashedPassword = await bcrypt.hash(password, 10);
            existingUserByEmail.password = password;
            existingUserByEmail.verifyCode = verifyCode;
            existingUserByEmail.verifyCodeExpiry = new Date(Date.now() + 3600000);
            await existingUserByEmail.save();
        }
    }
    else{
        // const hashedPassword = await bcrypt.hash(password, 10);
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 1);

        const newUser = new User({
            username,
            email,
            password,
            verifyCode,
            verifyCodeExpiry: expiryDate
        });

        await newUser.save();
    }

    await sendingOTP(email, verifyCode, username);

    return res.status(201).json(new ApiResponse(201, "User registerd successfully"));
});

export const login = asyncHandler(async (req, res)=> {
    const {username, email, password} = req.body;
    if(!(username || email) || !password) {
        return res.status(400).json(new ApiResponse(400, "Please fill all the fields"))
    }

    const isUserExisted = await User.findOne({
        $or: [{username}, {email}]
    });

    if(!isUserExisted){
        return res.status(409).json(new ApiResponse(409, "User does not exists"));
    }

    const isCorrectPassword = await isUserExisted.isCorrectPassword(password);
    if(!isCorrectPassword){
        return res.status(409).json(new ApiResponse(403, "Invalid user credentials"));
    }

    const { token } = await generateToken(isUserExisted._id);

    const options = {
        httpOnly: true,
        secure: true,
    }

    const loggedInUser = await User.findById(isUserExisted._id).select("-password");

    const data = {
        user: loggedInUser,
    };

    return res.status(200).cookie("token", token, options).json(new ApiResponse(200, "User login successfully", data));
});

export const verifyCode = asyncHandler(async(req, res)=> {
    try {
        const {username, code} = req.body;
        if(!username || !code) {
            return res.status(401).json(new ApiResponse(401, "Please the otp"));
        }
        const user = await User.findOne({username: username.toLowerCase()});
    
        if(!user){
            return res.status(400).json(new ApiResponse(400, "User not found"));
        }
    
        const isCodeValid = user.verifyCode === code;
        const isCodeNotExpired = new Date(user.verifyCodeExpiry) > new Date();
    
        if(isCodeValid && isCodeNotExpired){
            user.isVerified = true;
            await user.save();
            return res.status(200).json(new ApiResponse(200, "Account verified successfully"));
        }
        else if(!isCodeNotExpired){
            return res.status(400).json(new ApiResponse(400, "Verification as expired please sign up again"));
        }
        else{
            return res.status(400).json(new ApiResponse(409, "Incorrect verification code"));
        }
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, "Verify Code Internal Server Error"));
    }
});

export const logout = asyncHandler(async (req, res)=> {
    await User.findByIdAndUpdate(req.user?._id, {
        $unset: {
            token: 1
        }
    }, {new: true});

    const options = {
        httpOnly: true,
        secure: true,
    };
    
    return res.status(200).clearCookie("token", options).json(new ApiResponse(200, "User logout successfully"));

});

export const forgotPassword = asyncHandler(async (req, res)=> {
    try {
        console.log("hi");
        const {oldPassword, newPassword} = req.body;
        if(!oldPassword || !newPassword){
            return res.status(401).json(new ApiResponse(401, "Please fill all the fields"));
        }

        const user = await User.findById(req.user?._id);

        console.log("helo");

        const isPasswordCorrect = await user.isCorrectPassword(oldPassword);
        if(!isPasswordCorrect){
            return res.status(401).json(new ApiResponse(401, "Invalid password"));
        }

        console.log("new");
        user.password = newPassword;
        await user.save({validateBeforeSave: false});
        return res.status(200).json(new ApiResponse(200, "Password changed successfully"));        
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, "Internal Server Error"));
    }
});

export const completeDetails = asyncHandler(async (req, res)=> {
    try {
        const { fullname, phoneNumber, gender } = req.body;
        
        if(!fullname || !phoneNumber || !gender){
            return res.status(401).json(new ApiResponse(401, "Please fill all the fields"));
        }

        const avatarLocalPath = req.file?.path;

        let avatar;
        if(avatarLocalPath){
            avatar = await uploadOnCloudinary(avatarLocalPath);
    
            if(!avatar.url){
                console.log("error");
            }
        }

        const gettingUser = await User.findById(req.user?._id);

        const user = await User.findByIdAndUpdate(req.user?._id, {
            $set: {
                fullname,
                profileImageUrl: avatar?.url ? avatar?.url : gettingUser.profileImageUrl,
                phoneNumber,
                gender
            }
        }, {new: true});

        const updatedUser = await User.findById(user._id).select("-password -token");
        if(!updatedUser){
            return res.status(500).json(new ApiResponse(500, "Something went wrong while uploading details"));
        }

        return res.status(201).json(new ApiResponse(201, "User profile completed"));
    } catch (error) {
        console.log(error);
        return res.status(500).json(new ApiResponse(500, "Internal Server Error"));
    }
});