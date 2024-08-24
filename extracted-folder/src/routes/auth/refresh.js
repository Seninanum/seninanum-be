const express = require("express");
const router = express.Router();
const pool = require("../../database/db");
const { generateAccessToken } = require("../../middlewares/jwt");

// access token 재발급
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;

  console.log(refreshToken);

  try {
    // refreshToken으로 사용자 정보 조회
    const [rows] = await pool.query(
      "SELECT * FROM user WHERE refreshToken = ?",
      [refreshToken]
    );

    console.log(rows);

    if (rows.length > 0) {
      // Access Token 생성
      const newAccessToken = generateAccessToken({
        userId: rows[0].userId,
        userType: rows[0].userType,
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
    console.error(error);
    return res
      .status(500)
      .json({ error: "An error occurred while checking the refreshToken" });
  }
});

module.exports = router;
