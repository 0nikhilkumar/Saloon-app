import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { bookedBooking, cancelledBooking } from "../controllers/booking.controller.js";

const router = Router();

router.route("/booking/:id").post(verifyJWT, bookedBooking);
router.route("/cancelled/:id").post(verifyJWT, cancelledBooking);

export default router;