const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  amount: Number,
  cartItems: Array,
  status: { type: String, default: "Pending" }, // Pending, Success, Failed
  transactionId: String,
});

const Payment = mongoose.model("Payment", PaymentSchema);
