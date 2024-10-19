import { Router } from "express";
import { completeDetails, forgotPassword, login, logout, register, verifyCode } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/verify-code").post(verifyCode);
router.route("/change-password").post(verifyJWT, forgotPassword);
router.route("/logout").post(verifyJWT, logout);
router.route("/complete-profile").patch(verifyJWT, upload.single("avatar"), completeDetails);

export default router;
