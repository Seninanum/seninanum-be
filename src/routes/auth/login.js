const express = require("express");
const router = express.Router();
const pool = require("../../database/db");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../middlewares/jwt");

// 시니나눔 로그인 요청
router.post("/login", async (req, res) => {
  /**
    #swagger.tags = ['Auth']
    #swagger.summary = '로그인'
   */
  const { userId } = req.body;

  // body 값이 없음
  if (!userId) {
    return res.status(400).json({ error: "값이 존재해야 합니다." });
  }

  try {
    const [profile] = await pool.query(
      "SELECT * FROM profile WHERE userId = ?",
      [userId]
    );

    if (profile.length > 0) {
      // 토큰 생성
      const accessToken = generateAccessToken({
        profileId: profile[0].profileId,
        userType: profile[0].userType,
      });
      const refreshToken = generateRefreshToken({});

      // DB에 토큰 저장
      await pool.query(
        "UPDATE user SET accessToken = ?, refreshToken = ? WHERE userId = ?",
        [accessToken, refreshToken, userId]
      );

      return res
        .status(200)
        .json({ message: "LOGIN", accessToken, refreshToken });
    } else {
      // 사용자 정보가 없음
      return res.status(200).json({ message: "SIGNUP" });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "An error occurred while checking the user ID" });
  }
});

module.exports = router;
