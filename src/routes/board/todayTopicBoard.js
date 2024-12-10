const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

// 게시글 생성 API
// 게시글 생성 API
router.post("/", async (req, res) => {
  const profileId = req.user.profileId;
  const { question, date } = req.body;

  try {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 기존 date 값이 존재하면 삭제
      await connection.query("DELETE FROM topicBoard WHERE date = ?", [date]);

      // 새로운 데이터 삽입
      await connection.query(
        "INSERT INTO topicBoard (profileId, question, date) VALUES (?, ?, ?)",
        [profileId, question, date]
      );

      await connection.commit();

      res.status(200).json({
        message: "게시글이 성공적으로 생성되었습니다.",
      });
    } catch (error) {
      await connection.rollback();
      console.error(error);
      res.status(500).json({ message: "게시글 생성에 실패했습니다." });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

router.get("/", async (req, res) => {});

module.exports = router;
