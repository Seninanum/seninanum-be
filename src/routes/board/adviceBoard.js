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
  const profileId = req.user.profileId;

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
      const post = {
        ...rows[0],
        isMyPost: rows[0].profileId === profileId, // 본인이 작성한 게시글 여부
      };
      res.status(200).json(post);
    } else {
      res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "게시글 조회에 실패했습니다." });
  }
});

// 게시글 삭제
router.delete("/:adviceBoardId", async (req, res) => {
  const { adviceBoardId } = req.params;
  const profileId = req.user.profileId;

  try {
    // 게시글 작성자인지 확인
    const [board] = await pool.query(
      "SELECT profileId FROM adviceBoard WHERE adviceBoardId = ?",
      [adviceBoardId]
    );

    if (board.length === 0) {
      return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
    }

    if (board[0].profileId !== profileId) {
      return res
        .status(403)
        .json({ message: "본인이 작성한 게시글만 삭제할 수 있습니다." });
    }

    const connection = await pool.getConnection(); // 트랜잭션 시작
    try {
      await connection.beginTransaction();

      // 댓글 ID 가져오기
      const [commentIds] = await connection.query(
        "SELECT id FROM comment WHERE boardType = 'advice' AND postId = ?",
        [adviceBoardId]
      );

      const commentIdList = commentIds.map((comment) => comment.id);

      if (commentIdList.length > 0) {
        // 댓글 좋아요 삭제
        await connection.query(
          "DELETE FROM likes WHERE type = 'comment' AND targetId IN (?)",
          [commentIdList]
        );

        // 게시글 댓글 삭제
        await connection.query(
          "DELETE FROM comment WHERE boardType = 'advice' AND postId = ?",
          [adviceBoardId]
        );
      }

      // 게시글 좋아요 삭제
      await connection.query(
        "DELETE FROM likes WHERE type = 'post' AND targetId = ?",
        [adviceBoardId]
      );

      // 게시글 삭제
      await connection.query(
        "DELETE FROM adviceBoard WHERE adviceBoardId = ?",
        [adviceBoardId]
      );

      await connection.commit(); // 트랜잭션 커밋
      res.status(200).json({ message: "게시글이 성공적으로 삭제되었습니다." });
    } catch (error) {
      await connection.rollback();
      console.error("게시글 삭제 중 오류:", error);
      res.status(500).json({ message: "게시글 삭제 중 오류가 발생했습니다." });
    } finally {
      connection.release(); // 연결 해제
    }
  } catch (error) {
    console.error("게시글 삭제 오류:", error);
    res.status(500).json({ message: "게시글 삭제에 실패했습니다." });
  }
});

module.exports = router;
