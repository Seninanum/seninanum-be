const express = require("express");
const router = express.Router();
const pool = require("../../database/db");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../middlewares/jwt");

// 시니나눔 로그인 요청
router.post("/login", async (req, res) => {
  const { userId } = req.body;

  // body 값이 없음
  if (!userId) {
    return res.status(400).json({ error: "값이 존재해야 합니다." });
  }

  try {
    const [rows] = await pool.query("SELECT * FROM user WHERE userId = ?", [
      userId,
    ]);

    if (rows.length > 0) {
      // 토큰 생성
      const accessToken = generateAccessToken({
        userId: rows[0].userId,
        userType: rows[0].userType,
      });
      const refreshToken = generateRefreshToken({});

      // DB에 토큰 저장
      await pool.query(
        "UPDATE user SET accessToken = ?, refreshToken = ? WHERE userId = ?",
        [accessToken, refreshToken, userId]
      );

      return res
        .status(200)
        .json({ message: "로그인 되었습니다.", accessToken, refreshToken });
    } else {
      // 사용자 정보가 없음
      return res.status(404).json({ message: "존재하지 않는 계정입니다." });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "An error occurred while checking the user ID" });
  }
});

module.exports = router;
