import { Router } from "express";
import { getNearbySaloon, gettingAllPartners, setupProfile, updatePartnerProfile, verificationOfPartner } from "../controllers/partner.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();


router.route("/set-up").post(verifyJWT, setupProfile);
router.route("/update-partner-shop").patch(verifyJWT, updatePartnerProfile);
router.route("/getAllPartner").get(gettingAllPartners);
router.route("/documents-verification/:partnerId").patch(verifyJWT, upload.array("verificationImages"), verificationOfPartner);
router.route("/nearbysaloon").get(verifyJWT, getNearbySaloon);


export default router;