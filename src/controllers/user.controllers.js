import { asyncHandler } from "../utils/asynchandler.js";
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/APIError.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { APIResponse } from "../utils/APIResponse.js";

const registerUser = asyncHandler(async (req, res, next) => {
 
    const{ fullname, email,username, password } = req.body;
    console.log("email:",email);

    if (
        [fullname,email,username,password].some((field)=>field?.trim()==="")
    ) {
        throw new ApiError(400,"all fields are required")
    }
    

    const existedUser=User.findOne(
        {
            $or:[{username},{email}]
        }
    ) 
    if (existedUser) {
        throw new ApiError(409,"User with email or username already exist")
    }
    const avtarLocalPath=req.files?.avtar[0]?.path;
    const coverImageLocalPath=req.files?.coverImage[0]?.path;
    if (!avtarLocalPath) {
        throw new ApiError(400,"avtar is required");
    }
    
    const avtar=await uploadOnCloudinary(avtarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)
        if (!avtar) {
            throw new ApiError(400,"avatr is required")
        }
        const user=User.create({
            fullname,
            avtar:avtar.url,
            coverImage:coverImage?.url || "",
            email,
            password,
            username:username.toLowerCase()
        })
        const createdUser=await User.findById(user._id).select("-password -refreshToken")
        if (!createdUser) {
            throw new ApiError(500,"something went wrong while registering the user ")
        }
        return res.status(201).json(
            new APIResponse(200,createdUser,"user registered succesfully")
        )
    });

export { registerUser };