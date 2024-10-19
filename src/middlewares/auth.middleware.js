import User from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

export const verifyJWT = asyncHandler(async (req, res, next)=> {
    try {
        const token = req.cookies?.token || req.header("Authorization").replace("Bearer ", "");
        
        if(!token){
            return res.status(400).json(new ApiResponse(400, "Unauthorized request"));
        }
    
        const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id).select("-password -token");
    
        if(!user){
            return res.status(400).json(new ApiResponse(401, "Invalid Access Token"));
        }
    
        req.user = user;
        next();
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, "Internal Server Error" || error?.message));
    }
});