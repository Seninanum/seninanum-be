const express = require("express");
const router = express.Router();
const pool = require("../../database/db");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../middlewares/jwt");

router.post("/signup", async (req, res) => {
  /**
    #swagger.tags = ['Auth']
    #swagger.summary = '회원가입'
   */

  const { userId, userType, nickname, gender, birthYear, profile } = req.body;

  if (!userId || !userType || !nickname || !gender || !birthYear || !profile) {
    return res.status(400).json({ error: "모든 값이 존재해야 합니다." });
  }

  // 토큰 생성
  const accessToken = await generateAccessToken({
    userId,
    userType,
  });
  const refreshToken = await generateRefreshToken({});

  try {
    // 카카오 로그인
    await pool.query(
      "INSERT INTO user (userId, accessToken, refreshToken) VALUES (?, ?, ?)",
      [userId, accessToken, refreshToken]
    );

    // 기본 프로필 정보
    await pool.query(
      "INSERT INTO profile (userId, userType, nickname, gender, birthYear, profile) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, userType, nickname, gender, birthYear, profile]
    );

    res.status(200).json({ message: "카카오 회원가입 완료" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the user" });
  }
});

module.exports = router;
