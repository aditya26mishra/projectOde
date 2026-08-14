import "dotenv/config";

import { app } from "./app.js";
import connectDB from "./db/index.db.js";

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