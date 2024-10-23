const userModel = require("../models/userSchema");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const EmailHelper = require("../utils/emailHelper");

const otpGenerator = function () {
  return Math.floor(Math.random() * 10000 + 90000);
};

const registerUser = async (req, res) => {
  try {
    const userExists = await userModel.findOne({ email: req?.body?.email });

    if (userExists) {
      return res.send({
        success: false,
        message: "User Already Exists",
      });
    }
    // hash the password
    const salt = await bcrypt.genSalt(10); // 2^10
    const hashedPassword = await bcrypt.hash(req?.body?.password, salt);
    req.body.password = hashedPassword;
    const newUser = new userModel(req?.body);
    await newUser.save();

    res.send({
      success: true,
      message: "Registration Successfull, Please Login",
    });
  } catch (error) {
    console.log(error);
  }
};

const loginUser = async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req?.body?.email });

    if (!user) {
      return res.send({
        success: false,
        message: "User does not exist. Please register",
      });
    }

    const validatePassword = await bcrypt.compare(
      req?.body?.password,
      user.password
    );

    if (!validatePassword) {
      return res.send({
        success: false,
        message: "Please enter valid password",
      });
    }
    const token = jwt.sign({ userId: user._id }, process.env.SecretKey, {
      expiresIn: "1d",
    });
    res.send({
      success: true,
      message: "You've Successfully Logged In",
      data: token,
    });
  } catch (error) {
    console.log(error);
  }
};

const currentUser = async (req, res) => {
  try {
    const user = await userModel.findById(req.body.userId).select("-password");
    res.send({
      success: true,
      message: "User Details Fetched Successfully",
      data: user,
    });
  } catch (error) {
    res.send({
      success: false,
      message: error.message,
    });
  }
};

const forgetPassword = async function (req, res) {
  try {
    /****
     * 1. You can ask for email
     * 2. check if email is present or not
     *  * if email is not present -> send a response to the user(user not found)
     * 3. if email is present -> create basic otp -> and send to the email
     * 4. also store that otp -> in the userModel
     * 5. to avoid that collison
     *      response -> unique url with id of the user and that will form your reset password
     *
     * ***/
    if (req.body.email == undefined) {
      return res.status(401).json({
        status: "failure",
        message: "Please enter the email for forget Password",
      });
    }
    // find the user -> going db -> getting it for the server
    let user = await userModel.findOne({ email: req.body.email });
    if (user == null) {
      return res.status(404).json({
        status: "failure",
        message: "user not found for this email",
      });
    }
    // got the user -> on your server
    const otp = otpGenerator();
    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000;
    // those updates will be send to the db
    await user.save();
    res.status(200).json({
      status: "success",
      message: "otp sent to your email",
    });
    // send the mail to there email -> otp
    await EmailHelper("otp.html", user.email, {
      name: user.name,
      otp: otp,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
      status: "failure",
    });
  }
  //  email
};

const resetPassword = async function (req, res) {
  //  -> otp
  //  newPassword and newConfirmPassword
  // -> params -> id
  try {
    let resetDetails = req.body;
    // required fields are there or not
    if (!resetDetails.password == true || !resetDetails.otp == true) {
      return res.status(401).json({
        status: "failure",
        message: "invalid request",
      });
    }
    // it will serach with the id -> user
    const user = await userModel.findOne({ otp: req.body.otp });
    // if user is not present
    if (user == null) {
      return res.status(404).json({
        status: "failure",
        message: "user not found",
      });
    }
    // if otp is expired
    if (Date.now() > user.otpExpiry) {
      return res.status(401).json({
        status: "failure",
        message: "otp expired",
      });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req?.body?.password, salt);
    req.body.password = hashedPassword;
    user.password = req.body.password;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();
    res.status(200).json({
      status: "success",
      message: "password reset successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
      status: "failure",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  currentUser,
  forgetPassword,
  resetPassword,
};
