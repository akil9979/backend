import { Router } from "express";
import { loginUser,
    logoutUser,
     registerUser ,
     refreshAccesstoken,
     changeCurrentPassword,
     getCurrentUser,
     updateAccountDetails,
     UpdateUserAvatar,
     UpdateUserCoverImage,
     getUserChannelProfile,
     getWatchHistory,
    } from "../controllers/user.controllers.js";
 import {upload} from "../middlewares/multer.middlewares.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router= Router()
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
    )

router.route("/login").post(loginUser)
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-token").post(refreshAccesstoken)
router.route("/change-Password").post(verifyJWT,changeCurrentPassword)
router.route("/Current-User").post(verifyJWT,getCurrentUser)
router.route("/update-account").post(verifyJWT,updateAccountDetails)

router.route("/update-avatar").patch(verifyJWT,upload.single("avatar"),UpdateUserAvatar)
router.route("/update-coverImage").patch(verifyJWT,upload.single("coverImage"),UpdateUserCoverImage)

router.route("/c/:username").get(verifyJWT,getUserChannelProfile)
router.route("/history").get(verifyJWT,getWatchHistory)




export default router