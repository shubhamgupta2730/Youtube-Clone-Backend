import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,

  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,


  },
  fullname: {
    type: String,
    required: true,
    trim: true,
    index: true,

  },
  avatar: {
    type: String, //cloudinary url
    required: true,

  },
  coverImage: {
    type: String, //cloudinary url

  },
  watchHistory: [
    {
      type: Schema.Types.ObjectId,
      ref: "Video"
    }],
  password: {
    type: String,  //cahllenge
    required: [true, 'password is required'],


  },
  refreshToken: {
    type: String,

  },


}, { timestamps: true });


//pre  method: using for using bcypt as a middleware before saving data to application

//aero fuction is not used bcoz it cannot be used with this keyword

//hashing is time consuming algo so using async

//hash function is used for hashing

//now everytime a user updates anything, it bcypt will update password, so we have to apply a condition

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
})

//bcypt library can also be used for  checking the passwords
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password)

}

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullname: this.fullname,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
  )
}
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
  )
}


export const User = mongoose.model("User", userSchema);