import express from "epxress";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}))

//3 major CONFIGURATIONS: 
//limit is given to limit the json data 
app.use(express.json({ limit: "16kb" }))


//to use all kind of encoding in browsers URL 
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// It is used to serve static files such as images, CSS files, and JavaScript files.
app.use(express.static("public"));
app.use(cookieParser());

export { app };