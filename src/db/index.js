import mongoose from "mongoose";
import { DATABASE_NAME } from "../constants.js";

const connectDB = async ()=> {
    try {
        const connection = await mongoose.connect(`${process.env.MONGO_URI}/${DATABASE_NAME}`);
        let str = connection.connection.host.split("-")[0];
        console.log("MongoDB is connected with host:", str);
    } catch (error) {
        console.log("MongoDB Internal Server Error:", error);
    }
}

export default connectDB;