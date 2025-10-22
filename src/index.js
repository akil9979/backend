import mongoose from "mongoose";
import {DB_NAME} from "./constants.js";
import express from "express";
import  connectDB from "./db/index.js";
import dotenv from "dotenv";
dotenv.config({
    path: './env'
});
connectDB()

// (
//     async ()=>{
//         const app = express();
//         try {
//             await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//             app.on("error",(error)=>{
//                 console.error("Failed to connect to the database.", error);
//                 throw error; 
//             })
//             app.listen(process.env.PORT || 3000, () => {
//                 console.log(`Server is running on port ${process.env.PORT || 3000}`);
//             });
//         } catch (error) {
//             console.error("Error connecting to the database:", error);
//         }
//     }
// )()