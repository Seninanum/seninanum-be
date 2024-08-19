const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

// 경력 항목 추가
router.post("/", async (req, res) => {
  const { title, startYear, startMonth, endYear, endMonth, period, content } =
    req.body;
  if (
    !title ||
    !startYear ||
    !startMonth ||
    !endYear ||
    !endMonth ||
    !content
  ) {
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
      "INSERT INTO careerItem (userId, title, startYear, startMonth, endYear, endMonth, period, content) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [userId, title, startYear, startMonth, endYear, endMonth, period, content]
    );
    const [newCareer] = await pool.query(
      "SELECT * FROM careerItem WHERE careerId = ?",
      [result.insertId]
    );
    res.status(201).json({ career: newCareer[0] }); // 새 경력 항목
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the careerItem" });
  }
});
// 경력 항목 삭제
router.delete("/", async (req, res) => {
  const { careerId } = req.body;

  try {
    const [result] = await pool.query(
      "DELETE FROM careerItem WHERE careerId = ?",
      [careerId]
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
router.get("/list", async (req, res) => {
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