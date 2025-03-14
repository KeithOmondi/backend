// Create token and save it in cookies for an admin
const adminToken = (admin, statusCode, res) => {
    const token = admin.getJwtToken(); // Ensure `getJwtToken()` exists on `admin`
  
    // Options for cookies
    const options = {
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      httpOnly: true, // Prevent access via JavaScript
      sameSite: "none", // Cross-site usage
      secure: true, // Only send in HTTPS
    };
  
    res.status(statusCode)
      .cookie("adminToken", token, options) // ✅ Store as "adminToken" instead of "token"
      .json({
        success: true,
        admin, // ✅ Return the `admin` object
        token,
      });
  };
  
  module.exports = adminToken;
  