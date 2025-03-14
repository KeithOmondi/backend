const express = require("express");
const path = require("path");
const router = express.Router();
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/sendMail");
const Property = require("../model/property");
const { isAuthenticated, isAgent, isAdmin } = require("../middleware/auth");
const cloudinary = require("cloudinary");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/ErrorHandler");
const sendPropertyToken = require("../utils/propertyToken");

// create property
router.post("/create-property", catchAsyncErrors(async (req, res, next) => {
  try {
    const { email } = req.body;
    const agentEmail = await Property.findOne({ email });
    if (agentEmail) {
      return next(new ErrorHandler("User already exists", 400));
    }

    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
      folder: "avatars",
    });

    const agent = {
      name: req.body.name,
      email: email,
      password: req.body.password,
      avatar: {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      },
      address: req.body.address,
      phoneNumber: req.body.phoneNumber,
      zipCode: req.body.zipCode,
    };

    const activationToken = createActivationToken(agent);

    const activationUrl = `http://localhost:5173/agent/activation/${activationToken}`;

    try {
      await sendMail({
        email: agent.email,
        subject: "Activate your Property",
        message: `Hello ${agent.name}, please click on the link to activate your property: ${activationUrl}`,
      });
      res.status(201).json({
        success: true,
        message: `please check your email:- ${agent.email} to activate your property!`,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
}));

// create activation token
const createActivationToken = (agent) => {
  return jwt.sign(agent, process.env.ACTIVATION_SECRET, {
    expiresIn: "5m",
  });
};

// activate user
router.post("/activation", catchAsyncErrors(async (req, res, next) => {
  try {
    const { activation_token } = req.body;

    const newAgent = jwt.verify(
      activation_token,
      process.env.ACTIVATION_SECRET
    );

    if (!newAgent) {
      return next(new ErrorHandler("Invalid token", 400));
    }
    const { name, email, password, avatar, zipCode, address, phoneNumber } = newAgent;

    let agent = await Property.findOne({ email });

    if (agent) {
      return next(new ErrorHandler("User already exists", 400));
    }

    agent = await Property.create({
      name,
      email,
      avatar,
      password,
      zipCode,
      address,
      phoneNumber,
    });

    sendPropertyToken(agent, 201, res);
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}));

// login property
router.post("/login-property", catchAsyncErrors(async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ErrorHandler("Please provide all fields!", 400));
    }

    const user = await Property.findOne({ email }).select("+password");

    if (!user) {
      return next(new ErrorHandler("User doesn't exist!", 400));
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return next(
        new ErrorHandler("Please provide the correct information", 400)
      );
    }

    sendPropertyToken(user, 201, res);
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}));

// all agents --- for admin
router.get("/admin-all-agents", isAuthenticated, isAdmin("Admin"), catchAsyncErrors(async (req, res, next) => {
  try {
    const agents = await Property.find().sort({
      createdAt: -1,
    });
    res.status(201).json({
      success: true,
      agents,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}));

// delete agent ---admin
router.delete("/delete-agent/:id", isAuthenticated, isAdmin("Admin"), catchAsyncErrors(async (req, res, next) => {
  try {
    const agent = await Property.findById(req.params.id);

    if (!agent) {
      return next(new ErrorHandler("Agent is not available with this id", 400));
    }

    await Property.findByIdAndDelete(req.params.id);

    res.status(201).json({
      success: true,
      message: "Agent deleted successfully!",
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}));

module.exports = router;
