const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

router.post("/dropout", async (req, res) => {
  const profileId = req.user.profileId;
  const { telNum } = req.body;

  let connection;

  try {
    // 데이터베이스 연결 및 트랜잭션 시작
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 전화번호 확인
    const [result] = await connection.query(
      "SELECT * FROM profile WHERE telNum = ? AND profileId = ?",
      [telNum, profileId]
    );

    // 전화번호에 해당하는 사용자가 없는 경우
    if (!result.length) {
      await connection.rollback(); // 트랜잭션 롤백
      return res.status(404).json({ error: "User not found or mismatch" });
    }

    // 탈퇴 처리
    await connection.query("DELETE FROM profile WHERE profileId = ?", [
      profileId,
    ]);
    await connection.query("DELETE FROM user WHERE userId = ?", [
      result[0].userId,
    ]);

    // 추가 테이블 삭제
    const tablesToDelete = [
      "adviceBoard",
      "application",
      "comment",
      "freeBoard",
      "likes",
      "recruit",
      // "review",
      "topicBoard",
    ];

    for (const table of tablesToDelete) {
      await connection.query(`DELETE FROM ${table} WHERE profileId = ?`, [
        profileId,
      ]);
    }

    await connection.query(
      `DELETE FROM review WHERE reviewerId = ? OR targetId = ?`,
      [profileId, profileId]
    );

    //chatRoom 보류
    //경력프로필
    if (result[0].userType === "dong") {
      const [rowsToDelete] = await connection.query(
        "SELECT careerProfileId FROM careerProfile WHERE profileId = ?",
        [profileId]
      );

      if (rowsToDelete.length > 0) {
        const deletedIds = rowsToDelete.map((row) => row.id);

        await connection.query(
          "DELETE FROM careerProfile WHERE profileId = ?",
          [profileId]
        );

        for (const careerProfileId of deletedIds) {
          await connection.query(
            "DELETE FROM careerItem WHERE careerProfileId = ?",
            [careerProfileId]
          );
          await connection.query(
            "DELETE FROM careerCertificate WHERE careerProfileId = ?",
            [careerProfileId]
          );
        }
      }
    }

    // 트랜잭션 커밋
    await connection.commit();
    connection.release();

    return res.status(200).json({ message: "탈퇴하였습니다." });
  } catch (error) {
    // 에러 발생 시 트랜잭션 롤백
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error("Error during dropout process:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while processing dropout" });
  }
});

module.exports = router;
