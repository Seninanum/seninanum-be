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
      "SELECT careerProfileId, introduce, age, field, service, method, region, priceType, price FROM careerProfile WHERE profileId = ?",
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
    // 경력증명서 조회
    const [careerCertificate] = await pool.query(
      "SELECT name, status FROM careerCertificate WHERE careerProfileId = ?",
      [careerProfileId]
    );
    // 경력증명서를 객체로 반환
    const careerCertificateObj =
      careerCertificate.length > 0 ? careerCertificate[0] : {}; // 경력증명서가 없으면 빈 배열 처리

    // careerProfile 안에 careerItems와 careerCertificate를 포함시킴
    const response = {
      ...careerProfile[0],
      careerItems: careerItems,
      careerCertificate: careerCertificateObj,
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
   */

  const {
    profileId, // 경력 프로필 ID
    introduce,
    age,
    field,
    service,
    method,
    region,
    priceType,
    price,
  } = req.body;

  try {
    await pool.query(
      "UPDATE careerProfile SET introduce = ?, age = ?, field = ?, service = ?, method = ?, region = ?, priceType = ?, price = ? WHERE careerProfileId = ?",
      [
        introduce,
        age,
        field,
        service,
        method,
        region,
        priceType,
        price,
        profileId,
      ]
    );

    // progressStep 계산
    let progressStep = 0;

    // 각 조건을 확인하고 step을 추가
    if (introduce) {
      progressStep += 1;
    }
    if (age) progressStep += 1;
    if (field) progressStep += 1;
    if (service) progressStep += 1;
    if (method === "비대면") {
      progressStep += 1;
    } else if ((method === "대면" || method === "모두 선택") && region) {
      progressStep += 1;
    }
    if (priceType && price >= 0) {
      progressStep += 1;
    }
    const [careerItemsCount] = await pool.query(
      "SELECT COUNT(*) AS itemCount FROM careerItem WHERE careerProfileId = ?",
      [profileId]
    );
    if (careerItemsCount[0].itemCount > 0) progressStep += 1;
    const [careerCertificatesCount] = await pool.query(
      "SELECT COUNT(*) AS certificateCount FROM careerCertificate WHERE careerProfileId = ?",
      [profileId]
    );
    if (careerCertificatesCount[0].certificateCount > 0) progressStep += 1;

    // progressStep 값 업데이트
    await pool.query(
      "UPDATE careerProfile SET progressStep = ? WHERE careerProfileId = ?",
      [progressStep, profileId]
    );

    // isSatisfy 값 업데이트
    const isSatisfy = introduce && field ? 1 : 0;
    await pool.query(
      "UPDATE careerProfile SET isSatisfy = ? WHERE careerProfileId = ?",
      [isSatisfy, profileId]
    );

    res.status(200).json({
      message: "경력 프로필이 성공적으로 업데이트 되었습니다.",
      progressStep: progressStep,
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "경력 프로필 업데이트 중 오류가 발생했습니다." });
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
      "SELECT careerProfileId, profileId, introduce, field FROM careerProfile WHERE isSatisfy = 1 ORDER BY careerProfileId DESC"
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
          careerProfileId: career.careerProfileId,
          profileId: career.profileId,
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
    // 경력 프로필 조회
    const [career] = await pool.query(
      "SELECT * FROM careerProfile WHERE profileId = ?",
      [profileId]
    );

    // 기본 프로필 조회
    const [userInfo] = await pool.query(
      "SELECT nickname, gender, birthyear, profile FROM profile WHERE profileId = ?",
      [profileId]
    );

    if (userInfo.length === 0) {
      return res.status(404).json({ error: "프로필을 찾을 수 없습니다." });
    }

    const { nickname, gender, birthyear, profile } = userInfo[0];

    if (career.length === 0) {
      return res.status(200).json({
        nickname,
        gender,
        birthyear,
        profile,
      });
    }

    const {
      careerProfileId,
      introduce,
      age,
      field,
      service,
      method,
      region,
      price,
      priceType,
    } = career[0];

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

// router.post("/filter", async (req, res) => {
//   /**
//     #swagger.tags = ['Career']
//     #swagger.summary = '나리 필터링에 맞는 경력프로필 조회'
//    */

//   try {
//     const { method, priceType, price, region, field } = req.body;

//     // 필수 필터 조건 확인
//     if (!method || !priceType || !price || !field) {
//       return res.status(400).json({ error: "모든 필터 조건이 필요합니다." });
//     }

//     // 배열로 변환
//     const userFieldsArray = Array.isArray(field) ? field : field.split(",");
//     // 사용자가 보낸 필드들을 정렬
//     const userFieldsSorted = userFieldsArray
//       .map((f) => f.trim())
//       .sort()
//       .join(",");

//     // 경력 프로필 정보 가져오기
//     const [careers] = await pool.query(
//       "SELECT profileId, careerProfileId, introduce, field FROM careerProfile WHERE method = ? AND priceType = ? AND price = ? AND region = ?",
//       [method, priceType, price, region]
//     );

//     // 필드 비교
//     const filteredCareers = careers.filter((career) => {
//       const profileFieldsSorted = career.field
//         .split(",")
//         .map((f) => f.trim())
//         .sort()
//         .join(",");
//       return userFieldsSorted === profileFieldsSorted;
//     });

//     // 각 경력 프로필에 대해 사용자 정보를 병합
//     const careerWithUserInfo = await Promise.all(
//       filteredCareers.map(async (career) => {
//         const [userProfile] = await pool.query(
//           "SELECT nickname, gender, birthyear, profile FROM profile WHERE profileId = ?",
//           [career.profileId]
//         );
//         const { nickname, gender, birthyear, profile } = userProfile[0];
//         return {
//           careerProfileId: career.careerProfileId,
//           introduce: career.introduce,
//           field: career.field,
//           profileId: career.profileId,
//           nickname,
//           gender,
//           birthyear,
//           profile,
//         };
//       })
//     );

//     // 필터링된 결과 반환
//     res.status(200).json(careerWithUserInfo);
//   } catch (error) {
//     console.error("Error occurred: ", error.message);
//     res
//       .status(500)
//       .json({ error: "경력 프로필 정보를 불러오는 데 실패했습니다." });
//   }
// });

router.post("/filter", async (req, res) => {
  /**
    #swagger.tags = ['Career']
    #swagger.summary = '나리 필터링에 맞는 경력프로필 조회'
   */

  try {
    const { field, age, method, region, priceType, priceMin, priceMax } =
      req.body;

    // 조건 검증
    if ((method === "대면" || method === "모두 선택") && !region) {
      return res
        .status(400)
        .json({ error: "대면 또는 모두 선택인 경우 지역 정보가 필요합니다." });
    }
    if (priceType && (priceMin === undefined || priceMax === undefined)) {
      return res.status(400).json({
        error: "가격 유형이 설정된 경우 최소 금액과 최대 금액이 필요합니다.",
      });
    }

    // 필터링 조건 설정
    const conditions = ["isSatisfy = 1"];
    const params = [];

    if (method && method !== "모두 선택") {
      conditions.push("method = ?");
      params.push(method);
    }
    if (priceType && priceType !== "상관없음") {
      conditions.push("priceType = ?");
      params.push(priceType);
    }
    if (priceMin !== undefined && priceMax !== undefined) {
      conditions.push("price BETWEEN ? AND ?");
      params.push(priceMin, priceMax);
    }
    if (region) {
      conditions.push("region = ?");
      params.push(region);
    }

    // age 필터링 설정 (부분 일치)
    if (age && age !== "상관없음") {
      const ageArray = Array.isArray(age) ? age : age.split(",");
      ageArray.forEach((a) => {
        conditions.push("age LIKE ?");
        params.push(`%${a.trim()}%`);
      });
    }

    // 필드 조건 설정 (부분 일치)
    if (field) {
      const userFieldsArray = Array.isArray(field) ? field : field.split(",");
      userFieldsArray.forEach((f) => {
        conditions.push("field LIKE ?");
        params.push(`%${f.trim()}%`);
      });
    }

    // 쿼리 생성
    const query = `
      SELECT profileId, careerProfileId, introduce, field, age 
      FROM careerProfile
      ${conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""}
    `;

    // 경력 프로필 정보 가져오기
    const [careers] = await pool.query(query, params);

    // 각 경력 프로필에 대해 사용자 정보를 병합
    const careerWithUserInfo = await Promise.all(
      careers.map(async (career) => {
        const [userProfile] = await pool.query(
          "SELECT nickname, gender, birthyear, profile FROM profile WHERE profileId = ?",
          [career.profileId]
        );
        const { nickname, gender, birthyear, profile } = userProfile[0];
        return {
          careerProfileId: career.careerProfileId,
          introduce: career.introduce,
          field: career.field,
          profileId: career.profileId,
          age: career.age,
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
