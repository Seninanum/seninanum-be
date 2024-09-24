const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

router.get("/userType", async (req, res) => {
  /**
    #swagger.tags = ['User']
    #swagger.summary = '유저 정보 불러오기'
   */
  const user = req.user;

  try {
    const [career] = await pool.query(
      "SELECT progressStep FROM careerProfile WHERE userid = ?",
      [user.userId]
    );

    // career가 빈 배열일 경우 처리
    let result = -1;
    if (career.length > 0) {
      result = career[0];
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
