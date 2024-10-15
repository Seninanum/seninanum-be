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

// 구인글 지원 취소
router.delete("/", async (req, res) => {
  const { applicationId } = req.query; // req.query로 수정

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

// 동백의 구인글 지원 상태 조회
router.get("/status", async (req, res) => {
  const profileId = req.user.profileId;
  const { status } = req.query; // 쿼리파라미터로 status를 받음 ('모집중'/'마감')

  // status 값 검증
  if (status && status !== "모집중" && status !== "마감") {
    return res.status(400).json({
      error: "status는 '모집중' 또는 '마감'이어야 합니다.",
    });
  }

  try {
    const query = `
      SELECT a.applicationId, a.createdAt, 
             r.recruitId, r.title, r.content, r.method, r.region, r.status 
      FROM application a
      JOIN recruit r ON a.recruitId = r.recruitId
      WHERE a.profileId = ? AND r.status = ?`;

    const [applications] = await pool.query(query, [profileId, status]);

    res.status(200).json(applications);
  } catch (error) {
    console.error("지원 상태 조회 중 오류 발생:", error);
    res.status(500).json({
      error: "지원 상태 조회 중 오류가 발생했습니다.",
    });
  }
});

// 동백의 지원한 구인글 조회
router.get("/recruit/list", async (req, res) => {
  const profileId = req.user.profileId;
  try {
    // 동백이 지원한 구인글 recruitId를 조회
    const [applications] = await pool.query(
      `SELECT a.recruitId 
         FROM application a 
         WHERE a.profileId = ?`,
      [profileId]
    );

    // recruitId를 기준으로 recruit 테이블과 profile 테이블에서 정보 가져오기
    const recruitIds = applications.map((a) => a.recruitId);
    const placeholders = recruitIds.map(() => "?").join(", ");

    const [recruitInfo] = await pool.query(
      `SELECT r.recruitId, r.title, r.content, 
                p.profileId, p.nickname, p.profile 
         FROM recruit r
         JOIN profile p ON r.profileId = p.profileId
         WHERE r.recruitId IN (${placeholders})`,
      recruitIds
    );

    res.status(200).json(recruitInfo);
  } catch (error) {
    console.error("지원한 구인글 조회 중 오류 발생:", error);
    res.status(500).json({
      error: "지원한 구인글 조회 중 오류가 발생했습니다.",
    });
  }
});

// 지원자 목록 조회
router.get("/volunteer/:recruitId", async (req, res) => {
  const recruitId = req.params.recruitId;

  try {
    const [applicants] = await pool.query(
      `SELECT a.profileId, p.nickname, p.gender, p.birthyear
        FROM application a
        JOIN profile p ON a.profileId = p.profileId
        WHERE a.recruitId = ?`,
      [recruitId]
    );

    res.status(200).json(applicants);
  } catch (error) {
    console.error("지원자 목록 조회 중 오류 발생:", error);
    res.status(500).json({ error: "지원자 목록 조회 중 오류가 발생했습니다." });
  }
});

// 구인글 별 전체 지원자 목록 조회
router.get("/list", async (req, res) => {
  const profileId = req.user.profileId;
  const { recruitId } = req.query; // 쿼리파라미터로 recruitId를 받음

  try {
    // 사용자가 작성한 구인글의 recruitId 목록 조회
    const [recruitIds] = await pool.query(
      "SELECT r.recruitId FROM recruit r WHERE r.profileId = ?",
      [profileId]
    );

    let recruitIdList = recruitIds.map((r) => r.recruitId);
    let query = `
        SELECT a.profileId, p.nickname, p.gender, p.birthyear, 
             IFNULL(c.introduce, '') AS introduce, 
             IFNULL(c.field, '') AS field, 
             r.recruitId, r.title 
      FROM application a
      JOIN recruit r ON a.recruitId = r.recruitId
      JOIN profile p ON a.profileId = p.profileId
      LEFT JOIN careerProfile c ON a.profileId = c.profileId
      WHERE a.recruitId IN (${recruitIdList.map(() => "?").join(", ")})
      `;

    let params = [...recruitIdList];

    // recruitId가 제공된 경우 필터링 쿼리 확장
    if (recruitId) {
      const parsedRecruitId = Number(recruitId);
      if (!recruitIdList.includes(parsedRecruitId)) {
        return res.status(400).json({ error: "잘못된 recruitId입니다." });
      }
      query += " AND r.recruitId = ?";
      params.push(parsedRecruitId);
    }

    const [applicants] = await pool.query(query, params);

    res.status(200).json(applicants);
  } catch (error) {
    console.error("내 구인글 지원자 목록 조회 중 오류 발생:", error);
    res.status(500).json({
      error: "지원자 목록 조회 중 오류가 발생했습니다.",
      details: error.message,
    });
  }
});

module.exports = router;
