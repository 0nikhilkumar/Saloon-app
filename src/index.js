import { config } from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
config({path: "./.env"});

connectDB();
const port = process.env.PORT || 5000;

app.listen(port, ()=> {
    console.log(`Server is connected on PORT:${port}`);
});