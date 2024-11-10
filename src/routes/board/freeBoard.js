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
      `SELECT fb.freeBoardId, fb.profileId, fb.title, fb.content, fb.image, fb.likes, fb.commentCount, fb.createdAt, p.nickname, p.userType
         FROM freeBoard AS fb
         JOIN profile AS p ON fb.profileId = p.profileId
         ORDER BY fb.createdAt DESC`
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
  const profileId = req.user.profileId;

  try {
    // 게시글 정보 조회
    const [rows] = await pool.query(
      `SELECT fb.freeBoardId, fb.profileId, fb.title, fb.content, fb.image, fb.likes, fb.commentCount, fb.createdAt, 
                p.profile, p.nickname, p.userType
         FROM freeBoard AS fb
         JOIN profile AS p ON fb.profileId = p.profileId
         WHERE fb.freeBoardId = ?`,
      [freeBoardId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
    }

    const post = rows[0];
    // 사용자가 좋아요를 눌렀는지 여부 확인
    const [likeResult] = await pool.query(
      "SELECT id FROM likes WHERE targetId = ? AND type = 'post' AND profileId = ?",
      [freeBoardId, profileId]
    );
    const liked = likeResult.length > 0 ? 1 : 0;

    res.status(200).json({ ...post, liked });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "게시글 조회에 실패했습니다." });
  }
});

// 게시글 좋아요 등록/취소 API
router.post("/:freeBoardId/like", async (req, res) => {
  const profileId = req.user.profileId;
  const { freeBoardId } = req.params;

  try {
    // 좋아요 여부 확인
    const [existingLike] = await pool.query(
      "SELECT id FROM likes WHERE targetId = ? AND type = 'post' AND profileId = ?",
      [freeBoardId, profileId]
    );

    if (existingLike.length > 0) {
      // 좋아요가 이미 존재하면 -> 좋아요 취소
      await pool.query("DELETE FROM likes WHERE id = ?", [existingLike[0].id]);
      await pool.query(
        "UPDATE freeBoard SET likes = likes - 1 WHERE freeBoardId = ?",
        [freeBoardId]
      );
      return res.status(200).json({ message: "좋아요가 취소되었습니다." });
    } else {
      // 좋아요 추가
      await pool.query(
        "INSERT INTO likes (targetId, type, profileId) VALUES (?, 'post', ?)",
        [freeBoardId, profileId]
      );
      await pool.query(
        "UPDATE freeBoard SET likes = likes + 1 WHERE freeBoardId = ?",
        [freeBoardId]
      );
      return res.status(201).json({ message: "좋아요가 추가되었습니다." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "좋아요 처리에 실패했습니다." });
  }
});

module.exports = router;
