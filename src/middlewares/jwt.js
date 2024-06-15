const jwt = require("jsonwebtoken");
require("dotenv").config();

const secret = process.env.JWT_SECRET;

if (!secret) {
  throw new Error("JWT_SECRET is not defined in the environment variables");
}

//jwt 토큰 생성
function generateToken(payload) {
  return jwt.sign(payload, secret, { expiresIn: "30d" });
}

//jwt 토큰 검증
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401); // 토큰이 없는 경우

  try {
    const verificationResult = jwt.verify(token, secret);
    req.user = verificationResult; // 유저 정보를 요청 객체에 저장
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(403).json({ message: "JWT has expired" });
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ message: "Invalid JWT" });
    } else {
      return res.status(500).json({ message: "An unknown error occurred" });
    }
  }
}

module.exports = {
  generateToken,
  verifyToken,
};
