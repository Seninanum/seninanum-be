const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

//댓글 작성
router.post("/:freeBoardId", async (req, res) => {
  const profileId = req.user.profileId;
  const { freeBoardId } = req.params;
  const { content, isSecret = 0, parentId } = req.body;

  if (!content) {
    return res.status(400).json({ message: "댓글 내용을 입력해 주세요." });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO freeBoardComment (freeBoardId, profileId, content, isSecret, parentId) VALUES (?, ?, ?, ?, ?)",
      [freeBoardId, profileId, content, isSecret, parentId]
    );

    // 댓글 수 증가
    await pool.query(
      "UPDATE freeBoard SET commentCount = commentCount + 1 WHERE freeBoardId = ?",
      [freeBoardId]
    );

    res.status(201).json({
      id: result.insertId,
      message: "댓글이 성공적으로 추가되었습니다.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "댓글 추가에 실패했습니다." });
  }
});

// 댓글 조회
router.get("/:freeBoardId/comments", async (req, res) => {
  const { freeBoardId } = req.params;
  const profileId = req.user.profileId;

  try {
    // 게시글 작성자 ID 및 댓글 수 조회
    const [post] = await pool.query(
      "SELECT profileId, commentCount FROM freeBoard WHERE freeBoardId = ?",
      [freeBoardId]
    );
    const postOwnerId = post[0]?.profileId;
    const commentCount = post[0]?.commentCount;

    // 댓글과 작성자 정보 조회
    const [rows] = await pool.query(
      `SELECT c.id, c.profileId, c.content, c.isSecret, c.parentId, c.createdAt,
              p.profile, p.nickname, p.userType
         FROM freeBoardComment AS c
         JOIN profile AS p ON c.profileId = p.profileId
         WHERE c.freeBoardId = ?
         ORDER BY c.createdAt ASC`,
      [freeBoardId]
    );

    const comments = rows.reduce((acc, comment) => {
      // 비밀 댓글 필터링: 게시글 작성자와 댓글 작성자만 내용을 볼 수 있음
      if (
        comment.isSecret &&
        comment.profileId !== profileId &&
        comment.profileId !== postOwnerId
      ) {
        comment.content = "비밀 댓글입니다.";
      }

      if (comment.parentId === null) {
        acc.push({ ...comment, replies: [] });
      } else {
        const parent = acc.find((item) => item.id === comment.parentId);
        if (parent) {
          parent.replies.push(comment);
        }
      }
      return acc;
    }, []);

    res.status(200).json({
      commentCount,
      comments,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "댓글 조회에 실패했습니다." });
  }
});

module.exports = router;
