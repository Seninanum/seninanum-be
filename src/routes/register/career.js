const e = require("express");
const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

router.post("/", async (req, res) => {
  /**
   * #swagger.tags = ['Career']
   * #swagger.summary = '경력 프로필 생성'
   * #swagger.description = '경력 프로필 생성하기'
   */

  //생성되어있는 프로필이 있는지 확인
  const userId = req.user.userId;
  try {
    const [existingProfile] = await pool.query(
      "SELECT * FROM careerProfile WHERE userId = ?",
      [userId]
    );
    if (existingProfile.length === 0) {
      // 프로필 새로 생성
      const [result] = await pool.query(
        "INSERT INTO careerProfile (userId, introduce, age, field, service, method, region, priceType, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [userId, null, null, null, null, null, null, null, null]
      );
      // 생성된 프로필의 ID 반환
      const profileId = result.insertId;
      return res
        .status(201)
        .json({ profileId, message: "새 프로필이 생성되었습니다." });
    } else {
      // 기존 프로필 ID 반환
      const profileId = existingProfile[0].profileId;
      return res
        .status(200)
        .json({ profileId, message: "기존 프로필이 반환되었습니다." });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the careerProfile" });
  }
});

router.get("/:profileId", async (req, res) => {
  /**
   * #swagger.tags = ['Career']
   * #swagger.summary = '경력 프로필 상세항목 조회'
   * #swagger.description = '경력 프로필 상세항목 조회하기'
   */
  const profileId = req.params.profileId;

  const userId = req.user.userId;

  // userId가 careerProfile에 있으면 해당 행을 반환

  // userId가 careerProfile에 없으면 새로 생성

  try {
    const [career] = await pool.query(
      "select userId, introduce, age, field, service, method, region, priceType, price from careerProfile where profileId = ?",
      [profileId]
    );

    if (career.length === 0) {
      return res.status(404).json({ error: "career not found" });
    }

    const {
      userId,
      introduce,
      age,
      field,
      service,
      method,
      region,
      priceType,
      price,
    } = career[0];

    const [userInfo] = await pool.query(
      "SELECT nickname, gender, birthyear FROM user WHERE userId=?",
      [userId]
    );
    const { nickname, gender, birthyear } = userInfo[0];

    const response = {
      introduce,
      age,
      field,
      service,
      method,
      region,
      priceType,
      price,
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

//patch으로 변경
router.patch("/", async (req, res) => {
  /**
   * #swagger.tags = ['Career']
   * #swagger.summary = '경력 프로필 등록'
   * #swagger.description = '경력 프로필 등록하기'
   */

  const {
    profileId,
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
    // profileId인 곳에 프로필 Update
    const [result] = await pool.query(
      "UPDATE careerProfile SET introduce = ?, age = ?, field = ?, service = ?, method = ?, region = ?, priceType = ?, price = ? WHERE profileId = ?",
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

    res.status(201).json({ message: "경력프로필이 업데이트 되었습니다." });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the careerProfile" });
  }
});

// router.get("/list", async (req, res) => {
//   /**
//    * #swagger.tags = ['Career']
//    * #swagger.summary = '경력 프로필 조회'
//    * #swagger.description = '경력 프로필 조회하기'
//    */
//   try {
//     //경력프로필 정보
//     const [careers] = await pool.query(
//       "SELECT profileId, userId, introduce, age, field FROM careerProfile"
//     );

//     const careerWithUserInfo = await Promise.all(
//       careers.map(async (career) => {
//         const [user] = await pool.query(
//           "SELECT nickname, gender, birthyear FROM user WHERE userId = ?",
//           [career.userId]
//         );
//         const { nickname, gender, birthyear } = user[0];
//         return {
//           profileId: career.profileId,
//           introduce: career.introduce,
//           age: career.age,
//           field: career.field,
//           nickname,
//           gender,
//           birthyear,
//         };
//       })
//     );

//     res.status(200).json(careerWithUserInfo);
//   } catch (error) {
//     console.log(error);
//     res
//       .status(500)
//       .json({ error: "An error occurred while fetching career list" });
//   }
// });

module.exports = router;
