const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

router.post("/", async (req, res) => {
  /**
    #swagger.tags = ['Recruit']
    #swagger.summary = '구인글 등록'
   */
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

router.get("/list", async (req, res) => {
  /**
    #swagger.tags = ['Recruit']
    #swagger.summary = '구인글 목록 불러오기'
   */
  try {
    //구인글 정보
    const [recruits] = await pool.query(
      "SELECT recruitId, userId, title, content, method, region, field FROM recruit"
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
          recruitId: recruit.recruitId,
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
      .json({ error: "An error occurred while fetching recruit list" });
  }
});

router.get("/:recruitId", async (req, res) => {
  /**
    #swagger.tags = ['Recruit']
    #swagger.summary = '구인글 상세정보 불러오기'
   */
  const recruitId = req.params.recruitId;

  try {
    const [recruit] = await pool.query(
      "select userId, title, content, method, priceType, price, region, field, createdAt from recruit where recruitId = ?",
      [recruitId]
    );

    if (recruit.length === 0) {
      return res.status(404).json({ error: "Recruit not found" });
    }

    const {
      userId,
      title,
      content,
      method,
      priceType,
      price,
      region,
      field,
      createdAt,
    } = recruit[0];

    const [userInfo] = await pool.query(
      "SELECT nickname, gender, birthyear FROM user WHERE userId=?",
      [userId]
    );
    const { nickname, gender, birthyear } = userInfo[0];

    const response = {
      title,
      content,
      method,
      priceType,
      price,
      region,
      field,
      createdAt,
      nickname,
      gender,
      birthyear,
    };

    res.status(200).json(response);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching recruit detail" });
  }
});
module.exports = router;
