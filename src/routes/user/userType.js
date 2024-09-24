const express = require("express");
const { pool } = require("../../database/db");
const router = express.Router();

router.get("/userType", async (req, res) => {
  /**
    #swagger.tags = ['User']
    #swagger.summary = '유저 타입 불러오기'
   */
  const user = req.user;

  try {
    const [career] = await pool.query(
      "SELECT progressStep FROM careerProfile WHERE userid = ?",
      [user.userId]
    );

    // career가 빈 배열일 경우 처리
    const result = career[0];
    if (career.length > 0) {
      result = -1;
    }

    // 응답 형식화
    res.json({ userType: user.userType, career: result });
  } catch (error) {
    console.error("Error fetching user type:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching user type." });
  }
});

module.exports = router;
