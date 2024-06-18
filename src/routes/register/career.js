const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

// 경력프로필 등록
router.post("/", async (req, res) => {
  const { introduce, age, field, service, method, region, priceType, price } =
    req.body;

  const userId = req.user.userId;

  try {
    const [user] = await pool.query("SELECT * FROM user WHERE userId = ?", [
      userId,
    ]);
    if (user.length === 0) {
      return res.status(400).json({ error: "유효하지 않은 userId입니다." });
    }

    const [result] = await pool.query(
      "INSERT INTO careerProfile (userId, introduce, age, field, service, method, region, priceType, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [userId, introduce, age, field, service, method, region, priceType, price]
    );

    res.status(201).json({ message: "경력프로필이 등록되었습니다." });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the careerProfile" });
  }
});

// 경력프로필 목록 불러오기
router.get("/list", async (req, res) => {
  try {
    //경력프로필 정보
    const [careers] = await pool.query(
      "SELECT profileId, userId, introduce, age, field FROM careerProfile"
    );

    const careerWithUserInfo = await Promise.all(
      careers.map(async (career) => {
        const [user] = await pool.query(
          "SELECT nickname, gender, birthyear FROM user WHERE userId = ?",
          [career.userId]
        );
        const { nickname, gender, birthyear } = user[0];
        return {
          profileId: career.profileId,
          introduce: career.introduce,
          age: career.age,
          field: career.field,
          nickname,
          gender,
          birthyear,
        };
      })
    );

    res.status(200).json(careerWithUserInfo);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching career list" });
  }
});

module.exports = router;
