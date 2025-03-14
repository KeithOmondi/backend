const express = require("express");
const ErrorHandler = require("./middleware/error");
const app = express();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");

app.use(cors({
  origin: ['https://haochapchap.vercel.app',],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());


app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

// config
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env",
  });
}

// import routes
const client = require("./controller/client");
const property = require("./controller/property");
const listing = require("./controller/listing");
const transaction = require("./controller/transaction");
const withdraw = require("./controller/withdraw");
const event = require("./controller/event");
const admin = require("./controller/admin")

const payment = require("./controller/payment");

app.use("/api/v2/client", client);
app.use("/api/v2/transaction", transaction);
app.use("/api/v2/property", property);
app.use("/api/v2/lisiting", listing);
app.use("/api/v2/event", event);
app.use("/api/v2/payment", payment);
app.use("/api/v2/withdraw", withdraw);
app.use("/api/v2/admin", admin)

// it's for ErrorHandling
app.use(ErrorHandler);
// app.use("/", (req, res) => {
//   res.send("Hello world!");
// });

module.exports = app;
