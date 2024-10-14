const express = require("express");
const router = express.Router();
const pool = require("../../database/db");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { generateAccessToken } = require("../../middlewares/jwt");

router.post("/refresh", async (req, res) => {
  /**
    #swagger.tags = ['Auth']
    #swagger.summary = '액세스 토큰 재발급'
   */
  const { refreshToken } = req.body;

  try {
    jwt.verify(refreshToken, process.env.REFRESH_SECRET);

    // refreshToken으로 사용자 정보 조회
    const [user] = await pool.query(
      "SELECT * FROM user WHERE refreshToken = ?",
      [refreshToken]
    );
    const [profile] = await pool.query(
      "SELECT * FROM profile WHERE userId = ?",
      [user[0].userId]
    );

    if (rows.length > 0) {
      // Access Token 생성
      const newAccessToken = generateAccessToken({
        profileId: profile[0].profileId,
        userType: profile[0].userType,
      });

      // DB에 저장
      await pool.query("UPDATE user SET accessToken = ? WHERE userId = ?", [
        newAccessToken,
        rows[0].userId,
      ]);

      return res.status(200).json({ accessToken: newAccessToken });
    } else {
      // 사용자 정보가 없음
      return res.status(404).json({ message: "존재하지 않는 계정입니다." });
    }
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res
        .status(401)
        .json({ message: "리프레시 토큰이 만료되었습니다." });
    } else if (error instanceof jwt.JsonWebTokenError) {
      // 토큰이 유효하지 않음
      return res
        .status(401)
        .json({ message: "유효하지 않은 리프레시 토큰입니다." });
    } else {
      // 그 외의 에러 처리
      console.error("An error occurred:", error);
      return res
        .status(500)
        .json({ error: "An error occurred while checking the refreshToken" });
    }
  }
});

module.exports = router;
