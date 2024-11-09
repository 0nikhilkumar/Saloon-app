import { Router } from "express";
import { addService, getAllServices, uploadGallery } from "../controllers/service.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/add-service").post(verifyJWT, upload.single("thumbnail"), addService);
router.route("/add-gallery").post(verifyJWT, upload.array("images", 10), uploadGallery)
router.route("/get-services").get(verifyJWT, getAllServices);

export default router;