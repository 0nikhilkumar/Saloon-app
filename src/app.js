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

app.use("/api/v1/user", userRouter);


export { app };