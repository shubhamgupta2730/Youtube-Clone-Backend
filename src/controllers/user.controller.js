import { asyncHandler } from "../utils/asyncHandler.js";

import { ApiError } from "../utils/ApiError.js";

import { User } from "../models/user.model.js";

import { uploadOnCloudinary } from "../utils/cloudinary.js";

import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    //get user details from frontend
    //validation-not empty
    //check if user already exist:check using username and email
    //check for images, check for avatar
    //upload them to cloudinary, avatar 
    //create user object - creation call entry in db
    //remove password and refresh token field from response
    //check for user creation
    //return response else send error


    //---------------1. get user details from frontend-------------------

    const { fullname, email, username, password } = req.body
    console.log("email: ", email);




    //-----------2.  validation-not empty----------------


    /*method to check for individual entries: 

    if (fullname === "") {
        throw new ApiError(400, "Full Name is required")
    }
    */

    //check for all entries in single method: 

    //The some method returns true if at least one element in the array satisfies the provided testing function.

    if (
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }


    //---------3.check if user already exist:check using username and email-------------
    const existedUser = await User.findOne({
        //$ symbol is used to use or operator and check for entries in database
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exist")
    }


    //-----------------4.  //check for images, check for avatar-----------------------

    //express give us access to req.body
    //multer gives us access to req.files
    //it may happen that access can be there or not so option chaning: 

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }
    // else {
    //     console.log("Avatar file path is uploaded")
    // }




    //-----------------5.upload them to cloudinary, avatar -------------------------------------

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    console.log("avatar uploaded on cloudinary");

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    console.log("cover Image uploaded on cloudinary");


    if (!avatar) {
        throw new ApiError(400, "Avatar file is not found")
    }



    //--------------6.create user object - creation call entry in db---------------------

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        //url is extracting from cover image only when it is available by optional chaning menthod.....
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    //7.-------------checking that user is created or not
    //remove password and refresh token field from response----------------------------------------
    const createUser = await User.findById(user._id).select("-password -refreshToken");
    //select method  is used in negation way, means we do not want to include password, and refreshtoken so adding them in select with - sign...........

    if (!createUser) {
        throw new ApiError(500, "Something went wrong while registering a user")
    }



    //8.-----------return response else send error-----------------

    return res.status(201).json(
        new ApiResponse(200, createUser, "User registered Successfully")
    )











})


export {
    registerUser,
}