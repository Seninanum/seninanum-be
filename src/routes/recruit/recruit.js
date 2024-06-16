const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

// 구인글 등록
router.post("/", async (req, res) => {
  const { title, content, method, priceType, price, region, field } = req.body;

  if (!title || !content || !method || !priceType || !price || !field) {
    return res.status(400).json({ error: "값이 존재해야 합니다." });
  }

  const userId = req.user.userId;

  try {
    const [user] = await pool.query("SELECT * FROM user WHERE userId = ?", [
      userId,
    ]);
    if (user.length === 0) {
      return res.status(400).json({ error: "유효하지 않은 userId입니다." });
    }

    const [result] = await pool.query(
      "INSERT INTO recruit (userId, title, content, method, priceType, price, region, field) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [userId, title, content, method, priceType, price, region, field]
    );

    res.status(201).json({ message: "구인글이 등록되었습니다." });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the recruit" });
  }
});

// 구인글 목록 불러오기
router.get("/list", async (req, res) => {
  try {
    //구인글 정보
    const [recruits] = await pool.query(
      "SELECT userId, title, content, method, region, field FROM recruit"
    );

    // 각 recruit에 대해 user 정보를 병합
    const recruitWithUserInfo = await Promise.all(
      recruits.map(async (recruit) => {
        const [user] = await pool.query(
          "SELECT nickname, gender, birthyear FROM user WHERE userId = ?",
          [recruit.userId]
        );
        const { nickname, gender, birthyear } = user[0];
        return {
          title: recruit.title,
          content: recruit.content,
          method: recruit.method,
          region: recruit.region,
          field: recruit.field,
          nickname,
          gender,
          birthyear,
        };
      })
    );

    res.status(200).json(recruitWithUserInfo);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching recruits" });
  }
});

module.exports = router;
