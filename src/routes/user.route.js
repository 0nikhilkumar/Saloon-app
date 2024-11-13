import { Router } from "express";
import { sentEmailForForgotPassword, completeDetails, gettingAllUsers, login, logout, register, verifyCode, verifyForgotPasswordOtp, forgotPassword, getUserProfile } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/verify-code").post(verifyCode);
router.route("/beforeforgotpassword").post(verifyJWT, sentEmailForForgotPassword);
router.route("/verifyforgotpassword").post(verifyJWT, verifyForgotPasswordOtp);
router.route("/forgotPassword").post(verifyJWT, forgotPassword);
router.route("/logout").post(verifyJWT, logout);
router.route("/complete-profile").patch(verifyJWT, upload.single("avatar"), completeDetails);
router.route("/getAllUsers").get(gettingAllUsers);
router.route("/getUserProfile").get(verifyJWT, getUserProfile);

export default router;
