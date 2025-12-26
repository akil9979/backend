import { asyncHandler } from "../utils/asynchandler.js";
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/APIError.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { APIResponse } from "../utils/APIResponse.js";
import jwt from "jsonwebtoken"


const generateAccessTokenAndRefreshToken = async (Userid) => {
    try {
        const user = await User.findById(Userid)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken

        // console.log("accessToken",accessToken);


        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "something went wrong while generating tokens")

    }
}
const registerUser = asyncHandler(async (req, res, next) => {

    const { fullname, email, username, password } = req.body;
    // console.log("email:", email);
    // console.log(req.body);
    // console.log(req.files);


    if (
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "all fields are required")
    }


    const existedUser = await User.findOne(
        {
            $or: [{ username }, { email }]
        }
    )
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exist")
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "avtar is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!avatar) {
        throw new ApiError(400, "avatr is required")
    }
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "something went wrong while registering the user");
    }
    return res.status(201).json(
        new APIResponse(200, createdUser, "user registered succesfully")
    )
});

const loginUser = asyncHandler(async (req, res, next) => {

    const { email, username, password } = req.body;

    // console.log("email",email);


    if (!username && !email) {
        throw new ApiError(404, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{ email }, { username }]
    })

    if (!user) {
        throw new ApiError(404, "user does not exit")
    }

    const isPasswordvalid = await user.isPasswordCorrect(password)
    if (!isPasswordvalid) {
        throw new ApiError(401, "password is incorrect")
    }
    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id)


    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new APIResponse(200, {
                user: loggedInUser, accessToken, refreshToken
            },
                "user logged in succesfully"
            )
        )
})
const logoutUser = asyncHandler(async (req, res, next) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new APIResponse(200, {}, "User logged Out"))

})
const refreshAccesstoken = asyncHandler(async (req, res) => {
    const incomingrefreshtoken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingrefreshtoken) {
        throw new ApiError(401, "unauthorized request");
    }
    const decodedtoken = jwt.verify(incomingrefreshtoken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decodedtoken?._id);
    if (!user) {
        throw new ApiError(401, "Invalid refresh token")
    }
    if (incomingrefreshtoken !== user?.refreshToken) {
        throw new ApiError(401, "Refresh token is expired or used")
    }
    const options = {
        httpOnly: true,
        secure: true
    }
    const { accessToken, newrefreshToken } = await generateAccessTokenAndRefreshToken(user._id);

    res.status(200)
        .cookie("accesstoken", accessToken, options)
        .cookie("refreshtoken", newrefreshToken, options)
        .json(200, accessToken, newrefreshToken, "access token refreshed")
})
const changeCurrentPassword = asyncHandler(async (req, res, next) => {
    const { oldPassword, newPassword } = req.body
    const user = User.findById(user?._id)
    const ispasswordcorrect = User.isPasswordCorrect(oldPassword)
    if (!ispasswordcorrect) {
        throw new ApiError(400, "invlaid old password")
    }
    user.password = newPassword;
    await user.save({ validateBeforeSave: false })
    return res.status(200)
        .json(new APIResponse(200, {}, "password change succesfuly"))
})
const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new APIResponse(
            200,
            req.user,
            "User fetched successfully"
        ))
})
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullname, email } = req.body
    const updateDetails = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname: fullname,
                email: email
            },
        },
        {
            new: true
        }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"))

})
const UpdateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }
    const avatar = uploadOnCloudinary(avatarLocalPath)
    if (!avatar.url) {
        throw new ApiError(400, "Error while avatar uploading ")
    }
    const user=await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true
        },

    ).select("-password")
    return res.status(200)
    .json(new APIResponse(200,user,"Update avatr image succesfully"))
})
const UpdateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }
    const coverImage = uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage.url) {
        throw new ApiError(400, "Error while avatar uploading ")
    }
    const user=await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        },

    ).select("-password")
    return res.status(200)
    .json(new APIResponse(200,user,"Update coverImage  succesfully"))
})
export { registerUser, loginUser, logoutUser, refreshAccesstoken, changeCurrentPassword,
     getCurrentUser, updateAccountDetails,UpdateUserAvatar,UpdateUserCoverImage };