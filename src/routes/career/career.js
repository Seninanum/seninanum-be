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
    #swagger.summary = '내 경력 프로필 조회'
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

router.get("/list", async (req, res) => {
  /**
    #swagger.tags = ['Career']
    #swagger.summary = '경력프로필 목록 불러오기'
    
   */
  try {
    //경력프로필 정보
    const [careers] = await pool.query(
      "SELECT careerProfileId, profileId, introduce, field FROM careerProfile"
    );

    // 각 경력프로필에 대해 user 정보를 병합
    const careerWithUserInfo = await Promise.all(
      careers.map(async (career) => {
        const [user] = await pool.query(
          "SELECT nickname, gender, birthyear, profile FROM profile WHERE profileId = ?",
          [career.profileId]
        );
        const { nickname, gender, birthyear, profile } = user[0];
        return {
          profileId: career.careerProfileId,
          introduce: career.introduce,
          field: career.field,
          nickname,
          gender,
          birthyear,
          profile,
        };
      })
    );

    res.status(200).json(careerWithUserInfo);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "경력프로필 정보를 불러오는 데에 실패했습니다." });
  }
});

//수정!!! profileId careerProfileId로 변경하기
router.get("/:profileId", async (req, res) => {
  /**
    #swagger.tags = ['Career']
    #swagger.summary = '경력프로필 상세조회'
    #swagger.parameters = [
      {
    "introduce": "",
    "age": "초등,유아,중등",
    "field": "돌봄,생활,입시",
    "service": null,
    "method": "비대면",
    "region": null,
    "price": null,
    "priceType": null,
    "nickname": "신주현",
    "gender": "여성",
    "birthyear": "2001",
    "profile": "http://img1.kakaocdn.net/thumb/R640x640.q70/?fname=http://t1.kakaocdn.net/account_images/default_profile.jpeg",
    "careerItems": []
    }
    ]
   */
  const profileId = req.params.profileId;
  // const profileId = req.user.profileId;

  try {
    const [career] = await pool.query(
      "SELECT * FROM careerProfile WHERE profileId = ?",
      [profileId]
    );

    if (career.length === 0) {
      return res.status(404).json({ error: "경력프로필이 조회되지 않습니다." });
    }

    const { introduce, age, field, service, method, region, price, priceType } =
      career[0];

    const [userInfo] = await pool.query(
      "SELECT nickname, gender, birthyear, profile FROM profile WHERE profileId = ?",
      [profileId]
    );
    const { nickname, gender, birthyear, profile } = userInfo[0];

    // 경력 상세 항목 조회
    const [careerItems] = await pool.query(
      "SELECT careerId, title, startYear, startMonth, endYear, endMonth, content FROM careerItem WHERE careerProfileId = ?",
      [careerProfileId]
    );

    const response = {
      introduce,
      age,
      field,
      service,
      method,
      region,
      price,
      priceType,
      nickname,
      gender,
      birthyear,
      profile,
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

router.post("/filter", async (req, res) => {
  /**
    #swagger.tags = ['Career']
    #swagger.summary = '나리 필터링에 맞는 경력프로필 조회'
   */

  try {
    const { method, priceType, price, region, field } = req.body;

    // 필수 필터 조건 확인
    if (!method || !priceType || !price || !field) {
      return res.status(400).json({ error: "모든 필터 조건이 필요합니다." });
    }

    // 배열로 변환
    const userFieldsArray = Array.isArray(field) ? field : field.split(",");
    // 사용자가 보낸 필드들을 정렬
    const userFieldsSorted = userFieldsArray
      .map((f) => f.trim())
      .sort()
      .join(",");

    // 경력 프로필 정보 가져오기
    const [careers] = await pool.query(
      "SELECT profileId, careerProfileId, introduce, field FROM careerProfile WHERE method = ? AND priceType = ? AND price = ? AND region = ?",
      [method, priceType, price, region]
    );

    // 필드 비교
    const filteredCareers = careers.filter((career) => {
      const profileFieldsSorted = career.field
        .split(",")
        .map((f) => f.trim())
        .sort()
        .join(",");
      return userFieldsSorted === profileFieldsSorted;
    });

    // 각 경력 프로필에 대해 사용자 정보를 병합
    const careerWithUserInfo = await Promise.all(
      filteredCareers.map(async (career) => {
        const [userProfile] = await pool.query(
          "SELECT nickname, gender, birthyear, profile FROM profile WHERE profileId = ?",
          [career.profileId]
        );
        const { nickname, gender, birthyear, profile } = userProfile[0];
        return {
          careerProfileId: career.careerProfileId,
          introduce: career.introduce,
          field: career.field,
          nickname,
          gender,
          birthyear,
          profile,
        };
      })
    );

    // 필터링된 결과 반환
    res.status(200).json(careerWithUserInfo);
  } catch (error) {
    console.error("Error occurred: ", error.message);
    res
      .status(500)
      .json({ error: "경력 프로필 정보를 불러오는 데 실패했습니다." });
  }
});

module.exports = router;
