const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

router.post("/", async (req, res) => {
  /**
    #swagger.tags = ['Career']
    #swagger.summary = '경력 프로필 생성'
   */

  // 생성되어있는 프로필이 있는지 확인
  const profileId = req.user.profileId;
  try {
    const [existingProfile] = await pool.query(
      "SELECT * FROM careerProfile WHERE profileId = ?",
      [profileId]
    );

    if (existingProfile.length === 0) {
      // 프로필 새로 생성
      const [result] = await pool.query(
        "INSERT INTO careerProfile (profileId, introduce, age, field, service, method, region, priceType, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [profileId, null, null, null, null, null, null, null, null]
      );
      // 생성된 프로필의 ID 반환
      const careerProfileId = result.insertId;
      return res
        .status(201)
        .json({ careerProfileId, message: "새 프로필이 생성되었습니다." });
    } else {
      // 기존 프로필 ID 반환
      const careerProfileId = existingProfile[0].careerProfileId;
      return res
        .status(200)
        .json({ careerProfileId, message: "기존 프로필이 반환되었습니다." });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the careerProfile" });
  }
});

router.get("/", async (req, res) => {
  /**
    #swagger.tags = ['Career']
    #swagger.summary = '경력 프로필 상세항목 조회'
   */

  const profileId = req.user.profileId;

  try {
    // 경력 프로필 존재 여부 확인
    const [careerProfile] = await pool.query(
      "SELECT careerProfileId FROM careerProfile WHERE profileId = ?",
      [profileId]
    );
    if (careerProfile.length === 0) {
      return res.status(404).json({ error: "경력프로필이 존재하지 않음" });
    }

    // 경력 상세 항목 조회
    const careerProfileId = careerProfile[0].careerProfileId;
    const [careerItems] = await pool.query(
      "SELECT careerId, title, startYear, startMonth, endYear, endMonth, content FROM careerItem WHERE careerProfileId = ?",
      [careerProfileId]
    );

    // 응답 데이터 구조
    const response = {
      careerProfile: careerProfileId,
      careerItems: careerItems,
    };

    res.status(200).json(response);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "An error occurred while fetching recruit detail" });
  }
});

router.patch("/", async (req, res) => {
  /**
    #swagger.tags = ['Career']
    #swagger.summary = '경력 프로필 수정'
    #swagger.parameters = [
      {
        name: 'body',
        in: 'body',
        required: true,
        schema: {
          profileId: 111111,
          introduce: "소개",
          age: "60대",
          field: "경제",
          service: "제공할 서비스",
          method: "대면",
          region: "종로구",
          priceType: "시간당",
          price: 1000,
          progressStep: 8
        },
      }
    ]
   */

  const {
    careerProfileId,
    introduce,
    age,
    field,
    service,
    method,
    region,
    priceType,
    price,
    progressStep,
  } = req.body;

  try {
    // profileId인 곳에 프로필 Update
    await pool.query(
      "UPDATE careerProfile SET introduce = ?, age = ?, field = ?, service = ?, method = ?, region = ?, priceType = ?, price = ?, progressStep = ? WHERE careerProfileId = ?",
      [
        introduce,
        age,
        field,
        service,
        method,
        region,
        priceType,
        price,
        progressStep,
        careerProfileId,
      ]
    );

    res.status(200).json({ message: "경력프로필이 업데이트 되었습니다." });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the careerProfile" });
  }
});

module.exports = router;
