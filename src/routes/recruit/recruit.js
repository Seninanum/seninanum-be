const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

router.post("/", async (req, res) => {
  /**
    #swagger.tags = ['Recruit']
    #swagger.summary = '구인글 등록'
   */
  const { title, content, method, priceType, price, region, field } = req.body;

  if (!title || !content || !method || !priceType || !price || !field) {
    return res.status(400).json({ error: "값이 존재해야 합니다." });
  }

  const profileId = req.user.profileId;
  try {
    await pool.query(
      "INSERT INTO recruit (profileId, title, content, method, priceType, price, region, field) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [profileId, title, content, method, priceType, price, region, field]
    );

    res.status(200).json({ message: "구인글이 등록되었습니다." });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the recruit" });
  }
});

router.delete("/:recruitId", async (req, res) => {
  /**
    #swagger.tags = ['Recruit']
    #swagger.summary = '구인글 삭제'
   */
  const profileId = req.user.profileId;
  const recruitId = req.params.recruitId;

  try {
    // 해당 구인글이 현재 사용자가 작성한 것인지 확인
    const [recruit] = await pool.query(
      "SELECT recruitId FROM recruit WHERE profileId = ? AND recruitId = ?",
      [profileId, recruitId]
    );

    if (recruit.length === 0) {
      return res
        .status(404)
        .json({ error: "구인글을 찾을 수 없거나 삭제 권한이 없습니다." });
    }

    // 지원자가 있는지 확인
    const [applications] = await pool.query(
      "SELECT COUNT(*) AS applicantCount FROM application WHERE recruitId = ?",
      [recruitId]
    );

    if (applications[0].applicantCount > 0) {
      // 지원자가 있을 경우 삭제하지 않고 메시지 반환
      return res
        .status(400)
        .json({ message: "지원한 사람이 있어 구인글을 삭제할 수 없습니다." });
    }

    await pool.query("DELETE FROM recruit WHERE recruitId = ?", [recruitId]);

    res.status(200).json({ message: "구인글이 성공적으로 삭제되었습니다." });
  } catch (error) {
    console.error("Error deleting recruit:", error);
    res
      .status(500)
      .json({ error: "구인글을 삭제하는 중 오류가 발생했습니다." });
  }
});

router.post("/close", async (req, res) => {
  /**
    #swagger.tags = ['Recruit']
    #swagger.summary = '구인글 마감'
   */
  const { recruitId } = req.body;

  if (!recruitId) {
    return res.status(400).json({ error: "recruitId가 필요합니다." });
  }

  try {
    const [result] = await pool.query(
      `UPDATE recruit 
       SET status = '마감' 
       WHERE recruitId = ?`,
      [recruitId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "해당 구인글을 찾을 수 없습니다." });
    }

    res.status(200).json({ message: "구인글이 마감되었습니다." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "구인글 마감 중 오류가 발생했습니다." });
  }
});

router.put("/:recruitId", async (req, res) => {
  /**
    #swagger.tags = ['Recruit']
    #swagger.summary = '내 구인글 수정'
   */
  const profileId = req.user.profileId;
  const recruitId = req.params.recruitId;
  const { title, content, method, priceType, price, region, field } = req.body;

  if (!title || !content || !method || !priceType || !price || !field) {
    return res.status(400).json({ error: "모든 필드를 입력해야 합니다." });
  }

  try {
    // 해당 구인글이 현재 사용자가 작성한 것인지 확인
    const [recruit] = await pool.query(
      "SELECT recruitId FROM recruit WHERE profileId = ? AND recruitId = ?",
      [profileId, recruitId]
    );

    if (recruit.length === 0) {
      return res
        .status(404)
        .json({ error: "구인글을 찾을 수 없거나 수정 권한이 없습니다." });
    }

    // 구인글 수정 쿼리
    await pool.query(
      "UPDATE recruit SET title = ?, content = ?, method = ?, priceType = ?, price = ?, region = ?, field = ? WHERE recruitId = ?",
      [title, content, method, priceType, price, region, field, recruitId]
    );

    res.status(200).json({ message: "구인글이 성공적으로 수정되었습니다." });
  } catch (error) {
    console.error("Error updating recruit:", error);
    res
      .status(500)
      .json({ error: "구인글을 수정하는 중 오류가 발생했습니다." });
  }
});

router.get("/mylist/:recruitId", async (req, res) => {
  /**
    #swagger.tags = ['Recruit']
    #swagger.summary = '내 구인글 상세정보 조회'
   */
  const profileId = req.user.profileId;
  const recruitId = req.params.recruitId;

  try {
    const [recruit] = await pool.query(
      "SELECT recruitId, title, content, method, priceType, price, region, field, status, createdAt FROM recruit WHERE profileId = ? AND recruitId = ?",
      [profileId, recruitId]
    );

    if (recruit.length === 0) {
      return res
        .status(404)
        .json({ message: "해당 구인글을 찾을 수 없습니다." });
    }

    res.status(200).json(recruit[0]);
  } catch (error) {
    console.error("Error fetching recruit detail:", error);
    res
      .status(500)
      .json({ error: "구인글 상세정보를 불러오는 중 오류가 발생했습니다." });
  }
});

router.get("/mylist", async (req, res) => {
  /**
    #swagger.tags = ['Recruit']
    #swagger.summary = '내 구인글 목록 조회'
   */
  const profileId = req.user.profileId;
  const { status } = req.query;

  // 해당 사용자의 모든 구인글을 조회
  let query = `
    SELECT r.recruitId, r.title, r.content, r.method, r.region, r.field, r.status, 
           COUNT(a.applicationId) AS applicantCount
    FROM recruit r
    LEFT JOIN application a ON r.recruitId = a.recruitId
    WHERE r.profileId = ?`;

  const params = [profileId]; // 쿼리의 첫 번째 파라미터는 profileId

  // status가 쿼리 파라미터로 전달된 경우
  if (status) {
    if (status !== "모집중" && status !== "마감") {
      return res
        .status(400)
        .json({ error: "status는 '모집중' 또는 '마감'이어야 합니다." });
    }
    // 기본 쿼리에 status 필터 추가
    query += " AND status = ?";
    params.push(status); // 두 번째 파라미터로 status 값 추가
  }
  // 그룹화하여 각 구인글에 대한 지원자 수 카운트
  query += " GROUP BY r.recruitId";

  try {
    const [recruits] = await pool.query(query, params);
    res.status(200).json(recruits);
  } catch (error) {
    console.error("Error fetching user's recruit list:", error);
    res
      .status(500)
      .json({ error: "구인글 목록을 불러오는 중 오류가 발생했습니다." });
  }
});

router.get("/list", async (req, res) => {
  /**
    #swagger.tags = ['Recruit']
    #swagger.summary = '구인글 전체 목록 불러오기'
    
   */
  const userProfileId = req.user.profileId;
  try {
    //구인글 정보
    const [recruits] = await pool.query(
      "SELECT recruitId, profileId, title, content, method, region, field FROM recruit WHERE status != '마감'"
    );
    0;
    if (recruits.length === 0) {
      // 구인글이 없을 경우 빈 배열 반환
      return res.status(200).json([]);
    }

    // 각 recruit에 대해 user 정보를 병합
    const recruitWithUserInfo = await Promise.all(
      recruits.map(async (recruit) => {
        const [user] = await pool.query(
          "SELECT nickname, gender, birthyear, profile FROM profile WHERE profileId = ?",
          [recruit.profileId]
        );
        const { nickname, gender, birthyear, profile } = user[0];

        // application 테이블에서 지원 여부 확인
        const [application] = await pool.query(
          "SELECT * FROM application WHERE recruitId = ? AND profileId = ?",
          [recruit.recruitId, userProfileId]
        );
        const isApplicate = application.length > 0 ? 1 : 0;

        return {
          recruitId: recruit.recruitId,
          title: recruit.title,
          content: recruit.content,
          method: recruit.method,
          region: recruit.region,
          field: recruit.field,
          nickname,
          gender,
          birthyear,
          profile,
          isApplicate,
        };
      })
    );

    res.status(200).json(recruitWithUserInfo);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching recruit list" });
  }
});

router.post("/filter", async (req, res) => {
  /**
    #swagger.tags = ['Recruit']
    #swagger.summary = '상세조건 필터링에 맞는 구인글 조회'
   */
  try {
    const { field, method, region, priceType, priceMin, priceMax } = req.body;
    const profileId = req.user.profileId;

    if ((method === "대면" || method === "모두") && !region) {
      return res
        .status(400)
        .json({ error: "대면 또는 모두 선택인 경우 지역 정보가 필요합니다." });
    }
    if (
      priceType &&
      priceType !== "상관없음" &&
      (priceMin === undefined || priceMax === undefined)
    ) {
      return res.status(400).json({
        error: "가격 유형이 설정된 경우 최소 금액과 최대 금액이 필요합니다.",
      });
    }

    // 필터 조건과 파라미터 초기화
    const conditions = ["status = '모집중'"];
    const params = [];

    // 필드 조건 추가
    if (field) {
      const fieldsArray = Array.isArray(field) ? field : field.split(",");
      fieldsArray.forEach((f) => {
        conditions.push("field LIKE ?");
        params.push(`%${f.trim()}%`);
      });
    }

    // 만남 방식 필터링 설정
    if (method === "모두") {
      // "모두 선택"일 경우 모든 방식이 포함되도록 조건 설정
      conditions.push(
        "(method = '대면' OR method = '비대면' OR method = '모두')"
      );
    } else if (method) {
      // 특정 방식이 지정된 경우 해당 방식만 필터링
      conditions.push("method = ?");
      params.push(method);
    }

    //지역 필터링 설정
    if (method === "대면" && region) {
      conditions.push("region = ?");
      params.push(region);
    }

    // 가격 유형 및 가격 범위 필터링 설정(상관없음 포함 시 전체 조회)
    if (priceType && priceType !== "상관없음") {
      conditions.push("priceType = ?");
      params.push(priceType);
      if (priceMin !== undefined && priceMax !== undefined) {
        conditions.push("price BETWEEN ? AND ?");
        params.push(priceMin, priceMax);
      }
    }

    // 쿼리 생성
    const query = `
      SELECT recruit.recruitId, recruit.field, recruit.title, recruit.content, recruit.method, recruit.region
      FROM recruit
      ${conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""}
    `;

    // 조건에 맞는 구인글 조회
    const [recruits] = await pool.query(query, params);

    // 각 구인글에 대해 지원 여부 확인(지원O:1,지원X:0)
    const recruitWithApplicateStatus = await Promise.all(
      recruits.map(async (recruit) => {
        const [application] = await pool.query(
          "SELECT * FROM application WHERE recruitId = ? AND profileId = ?",
          [recruit.recruitId, profileId]
        );
        const isApplicate = application.length > 0 ? 1 : 0;

        return {
          recruitId: recruit.recruitId,
          field: recruit.field,
          title: recruit.title,
          content: recruit.content,
          method: recruit.method,
          region: recruit.region,
          isApplicate,
        };
      })
    );

    // 결과 반환
    res.status(200).json(recruitWithApplicateStatus);
  } catch (error) {
    console.error("Error occurred: ", error.message);
    res.status(500).json({
      error: "구인글 정보를 불러오는 데에 실패하였습니다.",
    });
  }
});

router.get("/:recruitId", async (req, res) => {
  /**
    #swagger.tags = ['Recruit']
    #swagger.summary = '구인글 상세정보 불러오기'
   */
  const recruitId = req.params.recruitId;
  const userProfileId = req.user.profileId;

  try {
    const [recruit] = await pool.query(
      "select profileId, title, content, method, priceType, price, region, field, createdAt from recruit where recruitId = ?",
      [recruitId]
    );

    if (recruit.length === 0) {
      return res.status(404).json({ error: "Recruit not found" });
    }

    const {
      profileId,
      title,
      content,
      method,
      priceType,
      price,
      region,
      field,
      createdAt,
    } = recruit[0];

    const [userInfo] = await pool.query(
      "SELECT nickname, gender, birthyear, profile FROM profile WHERE profileId=?",
      [profileId]
    );
    const { nickname, gender, birthyear, profile } = userInfo[0];

    // 해당 구인글에 대해 사용자가 지원했는지 여부 확인
    const [application] = await pool.query(
      `SELECT COUNT(*) AS hasApplied 
       FROM application 
       WHERE recruitId = ? AND profileId = ?`,
      [recruitId, userProfileId]
    );

    const hasApplied = application[0].hasApplied > 0 ? 1 : 0; // 1이면 지원한 상태, 0이면 미지원

    const response = {
      profileId,
      title,
      content,
      method,
      priceType,
      price,
      region,
      field,
      createdAt,
      nickname,
      gender,
      profile,
      birthyear,
      hasApplied,
    };

    res.status(200).json(response);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching recruit detail" });
  }
});

router.get("/others/:profileId", async (req, res) => {
  /**
    #swagger.tags = ['Recruit']
    #swagger.summary = '다른 사용자의 구인글 목록 조회'
   */
  const profileId = req.params.profileId;
  try {
    // 구인글과 작성자 정보를 함께 조회
    const [recruits] = await pool.query(
      `
      SELECT r.recruitId, r.title, r.content, r.method, r.region,
             p.nickname, p.gender, p.birthyear, p.profile
      FROM recruit r
      JOIN profile p ON r.profileId = p.profileId
      WHERE r.profileId = ? AND r.status != '마감'
      ORDER BY r.recruitId DESC
    `,
      [profileId]
    );

    if (recruits.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(recruits);
  } catch (error) {
    console.error("Error fetching other users' recruit list:", error);
    res.status(500).json({
      error: "다른 사용자의 구인글 목록을 불러오는 중 오류가 발생했습니다.",
    });
  }
});

module.exports = router;
