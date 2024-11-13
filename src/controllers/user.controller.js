import crypto from "crypto";
import User from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import sendMail from "../utils/nodemailer.js";
import { Otp } from "../models/otp.model.js";
import { Token } from "../models/token.mode.js";

const generateToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const token = await user.generateToken();

        if(!user.tokenId){
            const createdToken = await Token.create({
                token,
                userId
            });
            user.tokenId = createdToken._id;
            await user.save({validateBeforeSave: false});
        }

        await Token.findByIdAndUpdate(user.tokenId, {
            $set: {
                token
            }
        });
        
        return { token };
    } catch (error) {
        console.log("Generate token Internal Error");
    }
};

function isOtpValid(getOtpInfo) {
    // const otpLifetime = 10 * 60 * 1000;
    const currentTime = new Date().getTime();
    // const otpTime = new Date(getOtpInfo.updatedAt).getTime();

    if (currentTime <= getOtpInfo.verifyCodeExpiry) {
        return true;
    } else {
        return false;
    }
}

export const register = asyncHandler(async (req, res)=> {
    const {username, email, password, role} = req.body;
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

            const data = await User.findOne({ email });
            const getOtpDetailsById = await Otp.findOne({userId: data._id});
            getOtpDetailsById.verifyCode = verifyCode;
            getOtpDetailsById.verifyCodeExpiry = new Date(Date.now() + 3600000);

            await getOtpDetailsById.save();

            existingUserByEmail.password = password;
            await existingUserByEmail.save();
        }
    }
    else{
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 1);

        const newUser = await User({
            username,
            email,
            password,
            role,
        });
        await newUser.save();

        const newOtp = await Otp.create({
            verifyCode,
            verifyCodeExpiry: expiryDate,
            status: "Sign Up",
            userId: newUser._id
        });

        await newOtp.save();

        if(!newOtp){
            return res.status(401).json(new ApiResponse(401, "Otp is not created, please try again"));
        }

        await User.findByIdAndUpdate(newUser._id, {
            $push: {
                otp: newOtp._id,
            }
        });
    }

    await sendMail(email, verifyCode, username, "Sign Up");

    return res.status(201).json(new ApiResponse(201, "User registerd successfully, Otp Sent on email"));
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

    const loggedInUser = await User.findById(isUserExisted._id).select("-password").populate({
        path: "tokenId",
        select: "token -_id"
    });

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

        const getOtpInfo = await Otp.findOne({userId: user._id, status: "Sign Up"});
        if(!getOtpInfo){
            return res.status(403).json(new ApiResponse(403, "Otp not found, please sign up again"));
        }

        if(!isOtpValid(getOtpInfo)){
            return res.status(403).json(new ApiResponse(403, "Otp is expired, please send it again"));
        }
    
        const isCodeValid = getOtpInfo.verifyCode === code;
        const isCodeNotExpired = new Date(getOtpInfo.verifyCodeExpiry) > new Date();
    
        if(isCodeValid && isCodeNotExpired){
            getOtpInfo.verifyCodeExpiry = new Date(Date.now() - 3600000);
            getOtpInfo.otpVerfied = true;
            await getOtpInfo.save();
            user.isVerified = true;
            await user.save();
            return res.status(200).json(new ApiResponse(200, "Account verified successfully"));
        }
        else if(!isCodeNotExpired){
            return res.status(400).json(new ApiResponse(400, "Verification Code as expired please sign up again"));
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

// export const forgotPassword = asyncHandler(async (req, res)=> {
//     try {
//         const { email } = req.body;
//         if(!email){
//             return res.status(401).json(new ApiResponse(401, "Please provide the email to forgot Password"));
//         }

//         const emailIsExists = await User.findOne({ email });
//         if(!emailIsExists){
//             return res.status(403).json(new ApiResponse(403, "If Email exists, otp will sent"));
//         }

//         const verifyCode = crypto.randomInt(100000, 999999).toString();

//         const createNewOtp = await Otp.create({
//             verifyCode,
//             verifyCodeExpiry: new Date(Date.now() + 3600000),
//         });

//         await createNewOtp.save();

//         if(!createNewOtp){
//             return res.status(401).json(new ApiResponse(401, "Otp is not created, please try again"));
//         }

//         const user = await User.findByIdAndUpdate(emailIsExists?._id, {
//             $push: {
//                 otp: createNewOtp._id,
//                 type: "Forgot Password"
//             }
//         });

//         await sendMail(email, verifyCode, username);
        

//         // const isPasswordCorrect = await user.isCorrectPassword(oldPassword);
//         // if(!isPasswordCorrect){
//         //     return res.status(401).json(new ApiResponse(401, "Invalid password"));
//         // }

//         user.password = newPassword;
//         await user.save({validateBeforeSave: false});
//         return res.status(200).json(new ApiResponse(200, "Password changed successfully"));        
//     } catch (error) {
//         return res.status(500).json(new ApiResponse(500, "Internal Server Error"));
//     }
// });

export const sentEmailForForgotPassword = asyncHandler(async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json(new ApiResponse(400, "Please provide the email to reset password"));
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(403).json(new ApiResponse(403, "If the email exists, an OTP will be sent."));
        }

        const verifyCode = crypto.randomInt(100000, 999999).toString();

        const getForgotOtp = await Otp.findOne({status: "Forgot Password", userId: user._id});
        if(getForgotOtp){
            getForgotOtp.verifyCode = verifyCode;
            getForgotOtp.verifyCodeExpiry = new Date(Date.now() + 3600000);
            getForgotOtp.otpVerfied = false;
            await getForgotOtp.save();
        }
        else{
            const otpRecord = await Otp.create({
                verifyCode,
                verifyCodeExpiry: new Date(Date.now() + 3600000), // Expires in 1 hour,
                status: "Forgot Password",
                otpVerfied: false,
                userId: user._id
            });
    
            user.otp.push(otpRecord._id);
            await user.save();
        }

        await sendMail(email, verifyCode, user.username, "Forgot Password");

        return res.status(200).json(new ApiResponse(200, "OTP sent to your email"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, "Internal Server Error"));
    }
});

export const verifyForgotPasswordOtp = asyncHandler(async (req, res) => {
    try {
        const { otp } = req.body;
        if (!otp) {
            return res.status(400).json(new ApiResponse(400, "OTP is required"));
        }

        const getDbOtp = await Otp.findOne({userId: req.user._id, status: "Forgot Password"});
        if (!getDbOtp) {
            return res.status(404).json(new ApiResponse(404, "Otp not found"));
        }

        const isMatchedOtp = getDbOtp.verifyCode === otp;
        if(!isMatchedOtp){
            return res.status(401).json(new ApiResponse(401, "Enter valid otp"));
        }

        if(!isOtpValid(getDbOtp)){
            return res.status(403).json(new ApiResponse(403, "OTP is expired, please sent again"));
        }

        getDbOtp.otpVerfied = true;
        await getDbOtp.save();

        return res.status(200).json(new ApiResponse(200, "OTP verified successfully"));
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, "Internal Server Error"));
    }
});

export const forgotPassword = asyncHandler(async (req, res)=> {
    const getOtpDetails = await Otp.findOne({userId: req.user._id, status: "Forgot Password"});
    if(!getOtpDetails.otpVerfied){
        return res.status(403).json(new ApiResponse(403, "Please verify your email to forgot password"));
    }

    const { newPassword, confirmNewPassword } = req.body;
    if(!newPassword || !confirmNewPassword){
        return res.status(400).json(new ApiResponse(400, "Please enter both password"));
    }

    const isPasswordMatched = newPassword===confirmNewPassword;
    if(!isPasswordMatched){
        return res.status(401).json(new ApiResponse(401, "Please enter both correct password"));
    }

    const user = await User.findById(req.user._id);
    if(!user){
        return res.status(404).json(new ApiResponse(404, "User does not exists"));
    }

    user.password = newPassword;
    await user.save();
    return res.status(200).json(new ApiResponse(200, "Password changed successfully"));
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
            avatar = await uploadOnCloudinary(avatarLocalPath, "users");
    
            if(!avatar.url){
                console.log("error");
            }
        }

        const gettingUser = await User.findById(req.user?._id);

        if(!gettingUser){
            return res.status(404).json(new ApiResponse(404, "User not found"));
        }

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

export const gettingAllUsers = asyncHandler(async (req, res)=> {
    const getAllVerifiedUsers = await User.find({
        $and: [{isVerified: true}, {role: "User"}]
    }).select("-token -password -verifyCode -verifyCodeExpiry");

    if(!getAllVerifiedUsers){
        return res.status(403).json(new ApiResponse(403, "User Not Fetched Successfully"));
    }

    return res.status(200).json(new ApiResponse(200, "User Fetched Successfully", getAllVerifiedUsers));
});

export const getUserProfile = asyncHandler(async (req, res)=> {
    const user = await User.findById(req.user._id).select("+fullname +username +email +phoneNumber +gender");
    if(!user){
        return res.status(401).json(new ApiResponse(401, "User Not Fetched Successfully"));
    }

    return res.status(200).json(new ApiResponse(200, "User Profile fetched successfully", user));

})