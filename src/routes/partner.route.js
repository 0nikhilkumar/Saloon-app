import { Router } from "express";
import { getNearbySaloon, gettingAllPartners, setupProfile, updatePartnerProfile } from "../controllers/partner.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();


router.route("/set-up").post(verifyJWT, setupProfile);
router.route("/update-partner-shop").patch(verifyJWT, updatePartnerProfile);
router.route("/getAllPartner").get(gettingAllPartners);
router.route("/nearbysaloon").get(verifyJWT, getNearbySaloon);


export default router;