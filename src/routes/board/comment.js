const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

//댓글 작성
router.post("/:boardType/:postId", async (req, res) => {
  const profileId = req.user.profileId;
  const { boardType, postId } = req.params;
  const { content, isSecret = 0, parentId } = req.body;

  if (!content) {
    return res.status(400).json({ message: "댓글 내용을 입력해 주세요." });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO comment (boardType, postId, profileId, content, isSecret, parentId) VALUES (?, ?, ?, ?, ?, ?)",
      [boardType, postId, profileId, content, isSecret, parentId]
    );

    // 댓글 수 증가
    await pool.query(
      `UPDATE ${boardType}Board SET commentCount = commentCount + 1 WHERE ${boardType}BoardId = ?`,
      [postId]
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
router.get("/:boardType/:postId/comments", async (req, res) => {
  const { boardType, postId } = req.params;
  const profileId = req.user.profileId;

  try {
    // 게시글 작성자 ID 조회
    const [post] = await pool.query(
      `SELECT profileId FROM ${boardType}Board WHERE ${boardType}BoardId = ?`,
      [postId]
    );
    const postOwnerId = post[0]?.profileId;

    // 댓글과 작성자 정보 조회
    const [rows] = await pool.query(
      `SELECT c.id, c.profileId, c.content, c.isSecret, c.parentId, c.createdAt, c.likes,
              p.profile, p.nickname, p.userType
         FROM comment AS c
         JOIN profile AS p ON c.profileId = p.profileId
         WHERE c.boardType = ? AND c.postId= ?
         ORDER BY c.createdAt ASC`,
      [boardType, postId]
    );

    // 비밀 댓글 필터링 및 부모-자식 구조 생성
    const comments = rows.reduce((acc, comment) => {
      const isOwner = comment.profileId === profileId;
      // 비밀 댓글 필터링: 게시글 작성자와 댓글 작성자만 내용을 볼 수 있음
      if (
        comment.isSecret &&
        comment.profileId !== profileId &&
        comment.profileId !== postOwnerId
      ) {
        comment.content = "비밀 댓글입니다.";
      }
      const commentWithOwnerInfo = { ...comment, isOwner };

      if (comment.parentId === null) {
        acc.push({ ...commentWithOwnerInfo, replies: [] });
      } else {
        const parent = acc.find((item) => item.id === comment.parentId);
        if (parent) {
          parent.replies.push(commentWithOwnerInfo);
        }
      }
      return acc;
    }, []);

    res.status(200).json({
      comments,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "댓글 조회에 실패했습니다." });
  }
});

// 좋아요 등록/취소
router.post("/comment/:commentId/like", async (req, res) => {
  const profileId = req.user.profileId;
  const { commentId } = req.params;

  try {
    // 좋아요 여부 확인
    const [existingLike] = await pool.query(
      "SELECT id FROM likes WHERE targetId = ? AND type = 'comment' AND profileId = ?",
      [commentId, profileId]
    );

    if (existingLike.length > 0) {
      // 이미 좋아요가 존재 -> 좋아요 취소
      await pool.query("DELETE FROM likes WHERE id = ?", [existingLike[0].id]);
      await pool.query("UPDATE comment SET likes = likes - 1 WHERE id = ?", [
        commentId,
      ]);
      return res.status(200).json({ message: "좋아요가 취소되었습니다." });
    } else {
      // 좋아요 추가
      await pool.query(
        "INSERT INTO likes (targetId, type, profileId) VALUES (?, 'comment', ?)",
        [commentId, profileId]
      );
      await pool.query("UPDATE comment SET likes = likes + 1 WHERE id = ?", [
        commentId,
      ]);
      return res.status(201).json({ message: "좋아요가 추가되었습니다." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "좋아요 처리에 실패했습니다." });
  }
});

module.exports = router;
