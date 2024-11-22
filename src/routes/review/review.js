const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

// 리뷰 작성
router.post("/", async (req, res) => {
  /**
          #swagger.tags = ['Review']
          #swagger.summary = '리뷰 작성'
      */
  const { scheduleId, targetId, rating1, rating2, content, isSecret } =
    req.body;

  const reviewerId = req.user.profileId;

  // 필수 값 검증
  if (!reviewerId || !scheduleId || !targetId) {
    return res.status(400).json({ error: "필수 값이 누락되었습니다." });
  }

  try {
    // 리뷰 작성 쿼리
    const sql = `
          UPDATE review
          SET 
            rating1 = ?, 
            rating2 = ?, 
            content = ?, 
            isSecret = ?
          WHERE scheduleId = ? AND reviewerId = ? AND targetId = ?;
        `;

    const [result] = await pool.query(sql, [
      rating1,
      rating2,
      content,
      isSecret,
      scheduleId,
      reviewerId,
      targetId,
    ]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "리뷰를 작성할 대상이 존재하지 않습니다." });
    }

    res
      .status(200)
      .json({ message: "리뷰 작성 성공", scheduleId, reviewerId, targetId });
  } catch (error) {
    console.error("리뷰 작성 오류:", error);
    res.status(500).json({ error: "리뷰 작성 중 오류가 발생했습니다." });
  }
});

// 내 리뷰 조회
router.get("/me", async (req, res) => {
  /**
          #swagger.tags = ['Review']
          #swagger.summary = '내 리뷰 조회 및 작성 여부 분리'
      */
  const reviewerId = req.user.profileId;

  if (!reviewerId) {
    return res
      .status(400)
      .json({ error: "사용자 ID(reviewerId)가 필요합니다." });
  }

  try {
    const sql = `
        SELECT 
          r.reviewId,
          r.scheduleId,
          r.targetId,
          r.rating1,
          r.rating2,
          r.content,
          s.date AS scheduleDate,
          p.nickname AS targetNickname
        FROM review r
        LEFT JOIN schedule s ON r.scheduleId = s.scheduleId
        LEFT JOIN profile p ON r.targetId = p.profileId
        WHERE r.reviewerId = ?;
      `;

    const [reviews] = await pool.query(sql, [reviewerId]);

    // 작성 여부에 따라 분리
    const writtenReviews = [];
    const unwrittenReviews = [];

    reviews.forEach((review) => {
      const reviewData = {
        reviewId: review.reviewId,
        scheduleId: review.scheduleId,
        targetId: review.targetId,
        targetNickname: review.targetNickname,
        scheduleDate: review.scheduleDate,
        rating1: review.rating1,
        rating2: review.rating2,
        content: review.content,
      };

      if (review.rating1 !== null) {
        // 작성된 리뷰
        writtenReviews.push(reviewData);
      } else {
        // 작성되지 않은 리뷰
        unwrittenReviews.push({
          ...reviewData,
          rating1: null,
          rating2: null,
          content: null,
        });
      }
    });

    res.status(200).json({
      message: "내 리뷰 조회 성공",
      writtenReviews,
      unwrittenReviews,
    });
  } catch (error) {
    console.error("내 리뷰 조회 오류:", error);
    res.status(500).json({ error: "내 리뷰 조회 중 오류가 발생했습니다." });
  }
});

// 특정 사용자의 리뷰 조회
router.get("/:profileId", async (req, res) => {
  /**
          #swagger.tags = ['Review']
          #swagger.summary = '특정 사용자의 리뷰 조회'
      */
  const { profileId } = req.params;

  if (!profileId) {
    return res.status(400).json({ error: "profileId가 필요합니다." });
  }

  try {
    const sql = `
        SELECT 
          r.reviewId,
          r.scheduleId,
          r.reviewerId,
          r.rating1,
          r.rating2,
          r.content,
          r.isSecret,
          s.date AS scheduleDate,
          pr.nickname AS reviewerNickname,
          pr.profile AS reviewerProfile
        FROM review r
        LEFT JOIN schedule s ON r.scheduleId = s.scheduleId
        LEFT JOIN profile pr ON r.reviewerId = pr.profileId
        WHERE r.targetId = ?;
      `;

    const [reviews] = await pool.query(sql, [profileId]);

    // 데이터 가공
    const response = reviews.map((review) => ({
      reviewId: review.reviewId,
      scheduleId: review.scheduleId,
      scheduleDate: review.scheduleDate,
      reviewerId: review.reviewerId,
      reviewerNickname: review.reviewerNickname,
      reviewerProfile: review.reviewerProfile,
      rating1: review.rating1,
      rating2: review.rating2,
      content: review.content,
      isSecret: review.isSecret,
    }));

    res.status(200).json({
      message: "특정 사용자의 리뷰 조회 성공",
      reviews: response,
    });
  } catch (error) {
    console.error("특정 사용자의 리뷰 조회 오류:", error);
    res.status(500).json({ error: "리뷰 조회 중 오류가 발생했습니다." });
  }
});

module.exports = router;
