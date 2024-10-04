const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

router.get("/", async (req, res) => {
  /**
      #swagger.tags = ['User']
      #swagger.summary = '유저 기본정보 불러오기'
     */
  const user = req.user;

  try {
    const [profile] = await pool.query(
      "SELECT nickname, gender, birthYear, profile FROM user WHERE userId = ?",
      [user.userId]
    );

    // 응답 형식화
    res.status(200).json(profile[0]);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching user type." });
  }
});

module.exports = router;
