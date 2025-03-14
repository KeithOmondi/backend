const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const ErrorHandler = require("./middleware/error");

const app = express();

// ✅ Improved CORS Middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://haochapchap.vercel.app");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// ✅ Middleware Setup
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

// ✅ Load environment variables
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({ path: "config/.env" });
}

// ✅ Import Routes
const client = require("./controller/client");
const property = require("./controller/property");
const listing = require("./controller/listing"); // Fixed typo
const transaction = require("./controller/transaction");
const withdraw = require("./controller/withdraw");
const event = require("./controller/event");
const admin = require("./controller/admin");
const payment = require("./controller/payment");

// ✅ Setup API Routes
app.use("/api/v2/client", client);
app.use("/api/v2/transaction", transaction);
app.use("/api/v2/property", property);
app.use("/api/v2/listing", listing); // Fixed typo
app.use("/api/v2/event", event);
app.use("/api/v2/payment", payment);
app.use("/api/v2/withdraw", withdraw);
app.use("/api/v2/admin", admin);

// ✅ Default Route
app.get("/", (req, res) => {
  res.send("Hello World! Backend is running.");
});

// ✅ Error Handling Middleware
app.use(ErrorHandler);

module.exports = app;
