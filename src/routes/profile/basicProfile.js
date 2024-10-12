const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

router.get("/:profileId", async (req, res) => {
  /**
      #swagger.tags = ['Profile']
      #swagger.summary = '유저 기본정보 불러오기'
     */
  const { profileId } = req.params.profileId;

  try {
    const [profile] = await pool.query(
      "SELECT nickname, gender, birthYear, profile FROM profile WHERE profileId = ?",
      [profileId]
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
