// require('dotenv').config({path:'./env'})
import dotenv from "dotenv";

// import express from "epxress";
import connectDB from "./db/index.js";

dotenv.config({
  path: './env'
})

// const app = express();
connectDB();

/*
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    app.on("error ", () => {
      console.log("Error: ", error);
      throw error
    })

    app.listen(process.env.PORT, () => {
      console.log(`App is listening on port: ${process.env.PORT}`)
    })

  }
  catch (error) {
    console.error("ERROR:", error)
    throw error
  }
})()
*/

