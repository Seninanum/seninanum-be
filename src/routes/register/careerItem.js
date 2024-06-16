const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

// 경력 항목 추가
router.post("/career/add", async (req, res) => {
  const { userId, profileId, title, period, content } = req.body;

  try {
    const [user] = await pool.query("SELECT * FROM user WHERE userId = ?", [
      userId,
    ]);
    if (user.length === 0) {
      return res.status(400).json({ error: "유효하지 않은 userId입니다." });
    }

    const [result] = await pool.query(
      "INSERT INTO careerItem (userId, profileId, title, period, content) VALUES (?, ?, ?, ?, ?)",
      [userId, profileId, title, period, content]
    );

    res.status(201).json({ message: "경력프로필이 등록되었습니다." });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the careerItem" });
  }
});
// 경력 항목 삭제
router.delete("/career/delete", async (req, res) => {
  const { userId, title } = req.body;

  try {
    const [result] = await pool.query(
      "DELETE FROM careerItem WHERE userId = ? AND title = ?",
      [userId, title]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "경력 항목을 찾을 수 없습니다." });
    }

    res.status(200).json({ message: "경력 항목이 삭제되었습니다." });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "An error occurred while deleting the careerItem" });
  }
});

// 경력 항목 조회
router.get("/careers", async (req, res) => {
  try {
    const [results] = await pool.query("SELECT * FROM careerItem");
    res.status(200).json(results);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching the career items" });
  }
});
module.exports = router;
