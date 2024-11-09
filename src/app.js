import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));
app.use(express.json({limit: '16mb'}));
app.use(express.urlencoded({extended: true,limit: '16mb'}))
app.use(express.static("public"));
app.use(cookieParser());

// importing routes
import userRouter from "./routes/user.route.js"
import partnerRouter from "./routes/partner.route.js";
import serviceRouter from "./routes/service.route.js";
import { upload } from "./middlewares/multer.middleware.js";
import { uploadGallery } from "./controllers/service.controller.js";
import bookingRoute from "./routes/booking.route.js";

app.use("/api/v1/user", userRouter);
app.use("/api/v1/partner", partnerRouter);
app.use("/api/v1/partner/service", serviceRouter);
app.use("/api/v1/user/book", bookingRoute);

app.post("/getting-images", upload.array('images', 10), uploadGallery);


export { app };