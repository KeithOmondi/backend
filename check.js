const bcrypt = require("bcryptjs");
const Admin = require("./model/admin"); // Adjust path if needed
const mongoose = require("mongoose");

const updatePassword = async () => {
  await mongoose.connect("mongodb+srv://denniskeith62:keith.@cluster0.w7yid.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const password = "Admin1234";
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  await Admin.updateOne({ email: "2105062@students.kcau.ac.ke" }, { password: hashedPassword });

  console.log("Password updated successfully!");
  mongoose.connection.close();
};

updatePassword();
