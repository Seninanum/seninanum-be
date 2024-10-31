const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

// 게시글 생성 API
router.post("/", async (req, res) => {
  const profileId = req.user.profileId;
  const { title, content, image } = req.body;

  // 입력 값 유효성 검사
  if (!title || !content) {
    return res.status(400).json({ message: "제목과 내용을 입력해 주세요." });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO freeBoard (profileId, title, content, image, likes, commentCount) VALUES (?, ?, ?, ?, 0, 0)",
      [profileId, title, content, image]
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
      "SELECT freeBoardId, profileId, title, content, image, likes, commentCount, createdAt FROM freeBoard ORDER BY createdAt DESC"
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "게시글 목록 조회에 실패했습니다." });
  }
});

// 게시글 상세 조회 API
router.get("/:freeBoardId", async (req, res) => {
  const { freeBoardId } = req.params;

  try {
    const [rows] = await pool.query(
      "SELECT freeBoardId, profileId, title, content, image, likes, commentCount, createdAt FROM freeBoard WHERE freeBoardId = ?",
      [freeBoardId]
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
