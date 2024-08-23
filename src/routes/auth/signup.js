const express = require("express");
const router = express.Router();
const pool = require("../../database/db");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../middlewares/jwt");

router.post("/signup", async (req, res) => {
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
    const [result] = await pool.query(
      "INSERT INTO user (userId, userType, nickname, gender, birthYear, profile, accessToken, refreshToken) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        userId,
        userType,
        nickname,
        gender,
        birthYear,
        profile,
        accessToken,
        refreshToken,
      ]
    );

    res
      .status(201)
      .json({ message: "User created successfully", userId: result.userId });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the user" });
  }
});

module.exports = router;
