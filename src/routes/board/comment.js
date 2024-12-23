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

    // 좋아요 여부 확인 및 게시글 작성자 여부 체크
    const comments = await Promise.all(
      rows.map(async (comment) => {
        const [likeResult] = await pool.query(
          "SELECT id FROM likes WHERE targetId = ? AND type = 'comment' AND profileId = ?",
          [comment.id, profileId]
        );

        // 비밀 댓글 필터링: 게시글 작성자와 댓글 작성자만 내용을 볼 수 있음
        if (
          comment.isSecret &&
          comment.profileId !== profileId &&
          comment.profileId !== postOwnerId
        ) {
          comment.content = "비밀 댓글입니다.";
        }

        return {
          ...comment,
          isMyComment: comment.profileId === profileId,
          isPostOwner: comment.profileId === postOwnerId,
          liked: likeResult.length > 0 ? 1 : 0,
        };
      })
    );

    // 부모-자식 구조로 댓글 정리
    const formattedComments = comments.reduce((acc, comment) => {
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
      comments: formattedComments,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "댓글 조회에 실패했습니다." });
  }
});

// 댓글 삭제
router.delete("/:boardType/:postId/comment/:commentId", async (req, res) => {
  const { boardType, postId, commentId } = req.params;

  try {
    // 댓글 ID 확인
    const [commentData] = await pool.query(
      "SELECT id, parentId FROM comment WHERE id = ?",
      [commentId]
    );

    if (commentData.length === 0) {
      return res.status(404).json({ message: "댓글을 찾을 수 없습니다." });
    }

    const { parentId } = commentData[0];

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      if (parentId === null) {
        // 부모 댓글 삭제
        const [childComments] = await connection.query(
          "SELECT id FROM comment WHERE parentId = ?",
          [commentId]
        );

        const childCommentIds = childComments.map((child) => child.id);

        if (childCommentIds.length > 0) {
          // 자식 댓글 좋아요 삭제
          await connection.query(
            "DELETE FROM likes WHERE targetId IN (?) AND type = 'comment'",
            [childCommentIds]
          );

          // 자식 댓글 삭제
          await connection.query("DELETE FROM comment WHERE id IN (?)", [
            childCommentIds,
          ]);
        }

        // 부모 댓글 좋아요 삭제
        await connection.query(
          "DELETE FROM likes WHERE targetId = ? AND type = 'comment'",
          [commentId]
        );

        // 부모 댓글 삭제
        await connection.query("DELETE FROM comment WHERE id = ?", [commentId]);

        // 댓글 수 감소 (부모 + 자식)
        await connection.query(
          `UPDATE ${boardType}Board SET commentCount = commentCount - ? WHERE ${boardType}BoardId = ?`,
          [1 + childCommentIds.length, postId]
        );
      } else {
        // 자식 댓글 삭제
        await connection.query(
          "DELETE FROM likes WHERE targetId = ? AND type = 'comment'",
          [commentId]
        );

        await connection.query("DELETE FROM comment WHERE id = ?", [commentId]);

        // 댓글 수 감소 (자식 댓글 1개)
        await connection.query(
          `UPDATE ${boardType}Board SET commentCount = commentCount - 1 WHERE ${boardType}BoardId = ?`,
          [postId]
        );
      }

      await connection.commit();
      res.status(200).json({ message: "댓글이 성공적으로 삭제되었습니다." });
    } catch (error) {
      await connection.rollback();
      console.error("댓글 삭제 중 오류:", error);
      res.status(500).json({ message: "댓글 삭제 중 오류가 발생했습니다." });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("댓글 삭제 오류:", error);
    res.status(500).json({ message: "댓글 삭제 중 오류가 발생했습니다." });
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
