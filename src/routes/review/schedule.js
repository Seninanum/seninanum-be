const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

// 스케줄 생성
router.post("/", async (req, res) => {
  /**
        #swagger.tags = ['Schedule']
        #swagger.summary = '스케줄 생성 및 리뷰 초기화'
    */
  const { memberId, opponentId, date, time, place } = req.body;

  if (!memberId || !opponentId || !date || !time || !place) {
    return res.status(400).json({ error: "모든 필드를 입력해야 합니다." });
  }

  try {
    const scheduleSql = `
        INSERT INTO schedule (memberId, opponentId, date, time, place)
        VALUES (?, ?, ?, ?, ?);
      `;
    const [scheduleResult] = await pool.query(scheduleSql, [
      memberId,
      opponentId,
      date,
      time,
      place,
    ]);
    const scheduleId = scheduleResult.insertId;

    // 리뷰 초기화 상태로 생성
    const reviewSql = `
        INSERT INTO review (scheduleId, reviewerId, targetId, isSecret, rating1, rating2, content)
        VALUES
          (?, ?, ?, 0, NULL, NULL, NULL),
          (?, ?, ?, 0, NULL, NULL, NULL);
      `;
    await pool.query(reviewSql, [
      scheduleId,
      memberId,
      opponentId,
      scheduleId,
      opponentId,
      memberId,
    ]);

    res.status(201).json({ message: "스케줄 및 리뷰 초기화 완료" });
  } catch (err) {
    console.error("스케줄 생성 오류:", err);
    res.status(500).json({ error: "스케줄 생성 중 오류가 발생했습니다." });
  }
});

module.exports = router;
