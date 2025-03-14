const bcrypt = require("bcryptjs");

const testPassword = async () => {
  const originalPassword = "Admin1234";

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(originalPassword, salt);
  console.log("Hashed Password:", hashedPassword);

  // Compare entered password with the hashed one
  const isMatch = await bcrypt.compare(originalPassword, hashedPassword);
  console.log("Password match:", isMatch);
};

testPassword();
