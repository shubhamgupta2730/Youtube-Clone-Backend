import { asyncHandler } from "../utils/asyncHandler.js";

import { ApiError } from "../utils/ApiError.js";

import { User } from "../models/user.model.js";

import { uploadOnCloudinary } from "../utils/cloudinary.js";

import { ApiResponse } from "../utils/ApiResponse.js";


//access token generate
//refresh token generate

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        //we have to store refresh token in database

        user.refreshToken = refreshToken
        //we dont want to validate pass and other fields again so making validateBeforeSave as false,
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating accesss and refresh token")

    }
}

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

    const { fullname, email, username, password } = req.body;
    console.log("email: ", email);
    console.log("password: ", password);
    console.log("username: ", username);
    console.log("fullname: ", fullname);




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
    console.log("avatar local path: ", avatarLocalPath);
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    console.log("coverImageLocalPath:", coverImageLocalPath)

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }
    // else {
    //     console.log("Avatar file path is uploaded")
    // }




    //-----------------5.upload them to cloudinary, avatar -------------------------------------

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    console.log("avatar uploaded on cloudinary: ", avatar);

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    console.log("cover Image uploaded on cloudinary: ", coverImage);


    if (!avatar) {
        throw new ApiError(400, "Avatar file is not found on cloudinary")
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
    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    //select method  is used in negation way, means we do not want to include password, and refreshtoken so adding them in select with - sign...........

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering a user")
    }



    //8.-----------return response else send error-----------------

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )




})


const loginUser = asyncHandler(async (req, res) => {

    //email required form req body
    //check whether user exist or not
    //if not then give error 
    //check for password match
    //access token generate
    //refresh token generate
    //send cookies
    //response for successful login

    //----------------1. email pass require form req body---------------

    const { email, username, password } = req.body

    //-----------------------2. check whether user exist or not-------------------


    if (!username && !email) {
        throw new ApiError(400, "Username or password is required")
    }

    //find the user

    const user = await User.findOne({
        //mongodb operators
        $or: [{ email }, { username }]
    })
    console.log("user found in db: ", user);

    //if no user found

    if (!user) {
        throw new ApiError(404, "user not exist")
    }

    //---------------------------------3.check for password match------------------


    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(400, "Password is incorrect!!!")
    }

    console.log("password valid!!!: ", isPasswordValid);

    //4, --------------------access token generate
    //refresh token generate----------------------------------

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    console.log("Access token : ", accessToken);
    console.log("refresh token : ", refreshToken);


    //-------------------------5. send in  cookies---------------------

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }


    return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged In successfully"
            )
        )
})


const logoutUser = asyncHandler(async (req, res) => {

    //we cant do process as same as login because we are not taking data from body for logout, 
    //so introducing a middleware for logout functionality
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined,
            }
        },
        {
            new: true,
        },
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    console.log("User logged out");

    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200), {}, "User logged out");


})




export {
    registerUser,
    loginUser,
    logoutUser
}