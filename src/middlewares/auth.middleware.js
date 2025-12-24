import { ApiError } from "../utils/APIError.js";
import { asyncHandler } from "../utils/asynchandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"


export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer", "")
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
        const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)


        const user = User.findById(decodeToken?._id).select("-password ")

        if (!user) {
            throw new ApiError(401, "invalid Acces token")
        }
        req.user = user;
        next()

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid  acces token")
    }

})