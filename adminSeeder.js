const bcrypt = require("bcryptjs");
const Client = require("../model/client"); // Shared model
const crypto = require("crypto");

// Generate a random one-time password
const generateOTP = () => {
  return crypto.randomBytes(4).toString("hex"); // Generates an 8-character OTP
};

// Function to create admin
const createAdmin = async () => {
  try {
    const existingAdmin = await Client.findOne({ role: "admin" });

    if (!existingAdmin) {
      console.log("ℹ️ No admin found. Creating new admin...");

      const otp = generateOTP(); // Generate a one-time password
      const hashedPassword = await bcrypt.hash(otp, 10);

      const adminUser = new Client({
        name: "Admin",
        email: process.env.ADMIN_EMAIL, // Admin email from .env
        password: hashedPassword,
        role: "admin",
      });

      await adminUser.save();
      console.log("✅ Admin account created successfully!");
      console.log(`🔑 One-Time Password: ${otp}`);
    } else {
      console.log("ℹ️ Admin already exists.");
    }
  } catch (error) {
    console.error("❌ Error creating admin:", error);
  }
};

module.exports = createAdmin;
