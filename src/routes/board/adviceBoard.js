const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

// 게시글 생성 API
router.post("/", async (req, res) => {
  const profileId = req.user.profileId;
  const { title, content } = req.body;

  // 입력 값 유효성 검사
  if (!title || !content) {
    return res.status(400).json({ message: "제목과 내용을 입력해 주세요." });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO adviceBoard (profileId, title, content, commentCount) VALUES (?, ?, ?, 0)",
      [profileId, title, content]
    );
    res.status(201).json({
      id: result.insertId,
      message: "게시글이 성공적으로 생성되었습니다.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "게시글 생성에 실패했습니다." });
  }
});

// 게시글 목록 조회 API
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ab.adviceBoardId, ab.profileId, ab.title, ab.content, ab.commentCount, ab.createdAt, p.nickname, p.userType
         FROM adviceBoard AS ab
         JOIN profile AS p ON ab.profileId = p.profileId
         ORDER BY ab.createdAt DESC`
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "게시글 목록 조회에 실패했습니다." });
  }
});

// 게시글 상세 조회 API
router.get("/:adviceBoardId", async (req, res) => {
  const { adviceBoardId } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT ab.adviceBoardId, ab.profileId, ab.title, ab.content, ab.commentCount, ab.createdAt, 
                p.profile, p.nickname, p.userType
         FROM adviceBoard AS ab
         JOIN profile AS p ON ab.profileId = p.profileId
         WHERE ab.adviceBoardId = ?`,
      [adviceBoardId]
    );
    if (rows.length > 0) {
      res.status(200).json(rows[0]);
    } else {
      res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "게시글 조회에 실패했습니다." });
  }
});

module.exports = router;
