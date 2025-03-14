const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const Client = require("../model/client");
const Property = require("../model/property");

exports.isAuthenticated = catchAsyncErrors(async (req, res, next) => {
    const { token } = req.cookies;

    if (!token) {
        return next(new ErrorHandler("Please login to continue", 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.client = await Client.findById(decoded.id);

    next();
});

exports.isAgent = catchAsyncErrors(async (req, res, next) => {
    const { agent_token } = req.cookies;
    
    if (!agent_token) {
        return next(new ErrorHandler("Please login to continue", 401));
    }

    const decoded = jwt.verify(agent_token, process.env.JWT_SECRET_KEY);
    req.agent = await Property.findById(decoded.id);

    next();
});

exports.isAdmin = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.client.role)) {
            return next(new ErrorHandler(`${req.client.role} cannot access this resource!`));
        }
        next();
    };
};
