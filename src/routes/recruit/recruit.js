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

  const userId = req.user.userId;

  try {
    const [user] = await pool.query("SELECT * FROM user WHERE userId = ?", [
      userId,
    ]);
    if (user.length === 0) {
      return res.status(400).json({ error: "유효하지 않은 userId입니다." });
    }

    const [result] = await pool.query(
      "INSERT INTO recruit (userId, title, content, method, priceType, price, region, field) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [userId, title, content, method, priceType, price, region, field]
    );

    res.status(201).json({ message: "구인글이 등록되었습니다." });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the recruit" });
  }
});

router.get("/list", async (req, res) => {
  /**
    #swagger.tags = ['Recruit']
    #swagger.summary = '구인글 목록 불러오기'
    
   */
  try {
    //구인글 정보
    const [recruits] = await pool.query(
      "SELECT recruitId, userId, title, content, method, region, field FROM recruit"
    );

    // 각 recruit에 대해 user 정보를 병합
    const recruitWithUserInfo = await Promise.all(
      recruits.map(async (recruit) => {
        const [user] = await pool.query(
          "SELECT nickname, gender, birthyear FROM user WHERE userId = ?",
          [recruit.userId]
        );
        const { nickname, gender, birthyear } = user[0];
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

router.get("/filter", async (req, res) => {
  /**
    #swagger.tags = ['Recruit']
    #swagger.summary = '동백 분야에 맞는 구인글 조회'
    #swagger.parameters = [
    [{
        "field": "경제",
        "list": 
        [
            {
                "userId": 3518693517,
                "title": "은퇴를 앞두고 있습니다. 앞으로의 자산 계획에 조언을 구합니다.",
                "content": "은퇴를 앞두고 있는 60대 직장인입니다.",
                "method": "비대면 서비스",
                "priceType": "건당",
                "price": 10000,
                "region": "",
                "field": "경제,생활"
            },
            {
                "userId": 3725761489,
                "title": "장애아동 교육분야 전문가의 조언이 필요합니다.",
                "content": "안녕하세요? 대학생 나리입니다. ",
                "method": "비대면 서비스",
                "priceType": "건당",
                "price": 40000,
                "region": null,
                "field": "경제,교육"
            }
        ]
    },
    {
        "field": "입시",
        "list": []
    }
        ]
    ]
   */
  try {
    const userId = req.user.userId;
    const [rows] = await pool.query(
      "SELECT field FROM careerProfile WHERE userId = ?",
      [userId]
    );

    if (userId === 0) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    if (rows.length === 0 || !rows[0].field) {
      return res
        .status(400)
        .json({ error: "사용자 경력프로필 필드에 값이 없습니다." });
    }

    const field = rows[0].field;
    const fieldList = field.split(",").map((f) => f.trim());

    // SQL FIND_IN_SET 조건을 사용하여 쿼리문 생성 (OR 조건으로 연결)
    const whereClause = fieldList
      .map(() => `FIND_IN_SET(?, field)`)
      .join(" OR ");
    const query = `
      SELECT userId, title, content, method, priceType, price, region, field 
      FROM recruit 
      WHERE ${whereClause}
    `;

    const recruits = await pool.query(query, fieldList);

    // 필드별로 데이터를 그룹화
    const groupedResults = fieldList.map((field) => {
      const fieldRecruits = recruits[0].filter((recruit) => {
        const recruitFields = recruit.field.includes(",")
          ? recruit.field.split(",").map((f) => f.trim())
          : [recruit.field.trim()];

        // 요청된 필드 값도 trim 처리하여 비교
        const matched = recruitFields.some(
          (recruitField) => recruitField.trim() === field.trim()
        );
        return matched;
      });

      return { field, list: fieldRecruits };
    });
    res.status(200).json(groupedResults);
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

  try {
    const [recruit] = await pool.query(
      "select userId, title, content, method, priceType, price, region, field, createdAt from recruit where recruitId = ?",
      [recruitId]
    );

    if (recruit.length === 0) {
      return res.status(404).json({ error: "Recruit not found" });
    }

    const {
      userId,
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
      "SELECT nickname, gender, birthyear FROM user WHERE userId=?",
      [userId]
    );
    const { nickname, gender, birthyear } = userInfo[0];

    const response = {
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
      birthyear,
    };

    res.status(200).json(response);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching recruit detail" });
  }
});
module.exports = router;
