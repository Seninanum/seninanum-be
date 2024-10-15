const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

// 구인글 지원
router.post("/", async (req, res) => {
  const { recruitId } = req.body;
  const profileId = req.user.profileId;

  if (!recruitId) {
    return res.status(400).json({ error: "recruitId가 필요합니다." });
  }

  try {
    await pool.query(
      "INSERT INTO application (recruitId, profileId, createdAt) VALUES (?, ?, CURRENT_TIMESTAMP)",
      [recruitId, profileId]
    );

    res.status(201).json({ message: "지원이 완료되었습니다." });
  } catch (error) {
    console.error("지원 중 오류 발생:", error);
    res.status(500).json({ error: "지원 중 오류가 발생했습니다." });
  }
});

// 지원 취소
router.delete("/", async (req, res) => {
  const { applicationId } = req.body;

  if (!applicationId) {
    return res.status(400).json({ error: "applicationId가 필요합니다." });
  }

  try {
    const [result] = await pool.query(
      "DELETE FROM application WHERE applicationId = ?",
      [applicationId]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "해당 지원 내역을 찾을 수 없습니다." });
    }

    res.status(200).json({ message: "지원이 취소되었습니다." });
  } catch (error) {
    console.error("지원 취소 중 오류 발생:", error);
    res.status(500).json({ error: "지원 취소 중 오류가 발생했습니다." });
  }
});

module.exports = router;
