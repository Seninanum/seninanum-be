const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

router.get("/profile", async (req, res) => {
  /**
      #swagger.tags = ['Profile']
      #swagger.summary = '유저 기본정보 불러오기'
     */
  const profileId = req.user.profileId;

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

router.patch("/profile", async (req, res) => {
  const profileId = req.user.profileId;
  const { nickname, gender, birthYear, profile } = req.body;

  try {
    await pool.query(
      "UPDATE profile SET nickname = ?, gender = ?, birthYear = ?, profile = ? WHERE profileId = ?",
      [nickname, gender, birthYear, profile, profileId]
    );

    res.status(200).json({ message: "기존 정보가 업데이트 되었습니다." });
  } catch (error) {
    console.error("프로필 업데이트 중 에러 발생:", error);
    res
      .status(500)
      .json({ error: "기존 정보 업데이트 중 서버에 에러가 발생했습니다." });
  }
});

module.exports = router;
