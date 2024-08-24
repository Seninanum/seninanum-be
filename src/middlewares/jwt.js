const jwt = require("jsonwebtoken");
require("dotenv").config();

const ACCESS_SECRET = process.env.ACCESS_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error("JWT_SECRET is not defined in the environment variables");
}

//Access Token 생성
function generateAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: "10s" });
}

//Refresh Token 생성
function generateRefreshToken() {
  return jwt.sign({}, REFRESH_SECRET, { expiresIn: "1m" });
}

//jwt 토큰 검증
function verifyAccessToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const accessToken = authHeader && authHeader.split(" ")[1];

  // 토큰이 없는 경우
  if (accessToken == null) return res.sendStatus(401);

  try {
    const verificationResult = jwt.verify(accessToken, ACCESS_SECRET);

    req.user = verificationResult; // 유저 정보를 요청 객체에 저장
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "액세스 토큰이 만료되었습니다." });
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ message: "Invalid JWT" });
    } else {
      return res.status(500).json({ message: "An unknown error occurred" });
    }
  }
}

//jwt 토큰 검증
function verifyRefreshToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const refreshToken = authHeader && authHeader.split(" ")[1];

  // 토큰이 없는 경우
  if (refreshToken == null) return res.sendStatus(401);

  try {
    const verificationResult = jwt.verify(refreshToken, REFRESH_SECRET);

    req.user = verificationResult; // 유저 정보를 요청 객체에 저장
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res
        .status(401)
        .json({ message: "리프레시 토큰이 만료되었습니다." });
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ message: "Invalid JWT" });
    } else {
      return res.status(500).json({ message: "An unknown error occurred" });
    }
  }
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
