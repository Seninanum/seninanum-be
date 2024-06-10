const jwt = require("jsonwebtoken");
require("dotenv").config();

const secret = process.env.JWT_SECRET;

if (!secret) {
  throw new Error("JWT_SECRET is not defined in the environment variables");
}

function generateToken(payload) {
  return jwt.sign(payload, secret, { expiresIn: "30d" });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.error("Token expired");
      return { error: "TokenExpiredError", message: "JWT has expired" };
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.error("Invalid token");
      return { error: "JsonWebTokenError", message: "Invalid JWT" };
    } else {
      console.error("Unknown error");
      return { error: "UnknownError", message: "An unknown error occurred" };
    }
  }
}

module.exports = {
  generateToken,
  verifyToken,
};
