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

router.patch("/", async (req, res) => {
  /**
      #swagger.tags = ['User']
      #swagger.summary = '유저 기본정보 수정'
     */
  const { nickname, gender, birthYear, profile } = req.body;
  const user = req.user;

  try {
    // 기존 값을 유지하면서 필요한 부분만 업데이트
    const [currentProfile] = await pool.query(
      "SELECT nickname, gender, birthYear, profile FROM user WHERE userId = ?",
      [user.userId]
    );

    // 수정할 값이 있으면 해당 값으로 덮어씀
    const updatedNickname = nickname || currentProfile[0].nickname;
    const updatedGender = gender || currentProfile[0].gender;
    const updatedBirthYear = birthYear || currentProfile[0].birthYear;
    const updatedProfile = profile || currentProfile[0].profile;

    const [updateResult] = await pool.query(
      "UPDATE user SET nickname = ?, gender = ?, birthYear = ?, profile = ? WHERE userId = ?",
      [
        updatedNickname,
        updatedGender,
        updatedBirthYear,
        updatedProfile,
        user.userId,
      ]
    );

    if (updateResult.affectedRows > 0) {
      res.status(200).json({ message: "기존 정보가 업데이트 되었습니다." });
    } else {
      res
        .status(400)
        .json({ message: "기존 값과 동일해 변경된 데이터가 없습니다." });
    }
  } catch (error) {
    console.error("기존 정보 업데이트 중 에러가 발생했습니다.", error);
    res
      .status(500)
      .json({ error: "기존 정보 업데이트 중 서버에 에러가 발생했습니다." });
  }
});

module.exports = router;
