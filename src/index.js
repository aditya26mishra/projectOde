import { configDotenv } from "dotenv";

import { app } from "./app.js";
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.db.js";

configDotenv({
    path: "./.env"
});

connectDB()
.then(()=>{
    app.on("error", (error) => {
        console.log("error: ", error);
        throw error;
    })
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is running at PORT: ${process.env.PORT}`);
    });
})
.catch((err)=>{
    console.log("MongoDB connection failed", err);
});