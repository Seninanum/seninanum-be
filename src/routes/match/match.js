const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

router.get("/dong", async (req, res) => {
  /**
      #swagger.tags = ['Match']
      #swagger.summary = '최근 구인글의 분야별 동백 맞춤 추천'
     */
  try {
    const profileId = req.user.profileId;

    // 최근 구인글 가져오기
    const [recentRecruit] = await pool.query(
      "SELECT field, method FROM recruit WHERE profileId = ? ORDER BY createdAt DESC LIMIT 1",
      [profileId]
    );

    // 구인글이 없는 경우 빈 객체 반환
    if (recentRecruit.length === 0) {
      return res.status(200).json({ message: "작성한 구인글이 없습니다." });
    }

    const { field: recruitFields, method: recruitMethod } = recentRecruit[0];
    const fieldsArray = recruitFields.split(",");

    // 각 field에 해당하는 careerProfile 조회
    const recommendedProfiles = [];

    for (const field of fieldsArray) {
      const [profiles] = await pool.query(
        "SELECT careerProfileId,profileId,field FROM careerProfile WHERE field LIKE ? AND isSatisfy = 1",
        [`%${field.trim()}%`]
      );

      // 추천 대상 프로필이 없을 때 빈 값 설정
      if (profiles.length === 0) {
        recommendedProfiles.push({ field, recommendation: null }); // 빈 값으로 설정
        continue;
      }

      const scoredProfiles = await Promise.all(
        profiles.map(async (profile) => {
          let score = 0;

          // 경력 증명서 점수 부여
          const [certificate] = await pool.query(
            "SELECT status FROM careerCertificate WHERE careerProfileId = ?",
            [profile.careerProfileId]
          );
          if (certificate.length > 0 && certificate[0].status === "SUCCESS") {
            score += 3;
          }

          // 만남 방식 점수 부여
          if (
            recruitMethod === "모두선택" ||
            profile.method === recruitMethod
          ) {
            score += 2;
          }

          // 대면 또는 모두선택일 경우 지역 점수 계산
          if (
            (recruitMethod === "대면" || recruitMethod === "모두선택") &&
            profile.region === recruitRegion
          ) {
            score += 1;
          }

          // 경력 기간 점수 부여
          const [careerItems] = await pool.query(
            "SELECT startYear, startMonth, endYear, endMonth FROM careerItem WHERE careerProfileId = ?",
            [profile.careerProfileId]
          );

          // 경력 기간 계산
          let totalMonths = 0;
          for (const item of careerItems) {
            const start = new Date(item.startYear, item.startMonth - 1);
            const end =
              item.endYear && item.endMonth
                ? new Date(item.endYear, item.endMonth - 1)
                : new Date();
            totalMonths +=
              (end.getFullYear() - start.getFullYear()) * 12 +
              (end.getMonth() - start.getMonth());
          }

          // 경력 기간을 점수에 반영
          score += totalMonths / 12; // 경력 기간을 년 단위로 반영

          // profile 테이블에서 추가 정보 조회
          const [userProfile] = await pool.query(
            "SELECT nickname, birthyear, gender, profile FROM profile WHERE profileId = ?",
            [profile.profileId]
          );

          return {
            ...profile,
            nickname: userProfile[0].nickname,
            birthyear: userProfile[0].birthyear,
            gender: userProfile[0].gender,
            profile: userProfile[0].profile,
          };
        })
      );

      // 최고 점수의 프로필을 추천
      const topProfile = scoredProfiles.reduce(
        (max, profile) => (profile.score > max.score ? profile : max),
        scoredProfiles[0]
      );
      recommendedProfiles.push({ field, recommendation: topProfile });
    }

    res.status(200).json(recommendedProfiles);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "맞춤 추천 중 오류가 발생했습니다." });
  }
});

router.get("/recruit", async (req, res) => {
  /**
      #swagger.tags = ['Match']
      #swagger.summary = '분야별 맞춤형 구인글 추천'
     */
  const profileId = req.user.profileId;
  try {
    // 사용자의 careerProfile에서 field 조회
    const [userProfile] = await pool.query(
      "SELECT field, method, region FROM careerProfile WHERE profileId = ?",
      [profileId]
    );

    if (userProfile.length === 0) {
      return res.status(200).json({ message: "경력 프로필이 없습니다." });
    }

    const {
      field: userFields,
      method: userMethod,
      region: userRegion,
    } = userProfile[0];
    const fieldsArray = userFields.split(",");

    // 추천 구인글 결과를 저장할 객체
    const recommendedRecruits = [];

    for (const field of fieldsArray) {
      const [recruits] = await pool.query(
        "SELECT recruitId, title, method, region, field FROM recruit WHERE field LIKE ? AND status != '마감'",
        [`%${field.trim()}%`]
      );

      if (recruits.length === 0) {
        recommendedRecruits.push({ field, recommendation: null }); // 구인글이 없는 경우 빈 객체 설정
        continue;
      }

      // 점수 계산 및 구인글 필터링
      const scoredRecruits = recruits.map((recruit) => {
        let score = 0;

        // 만남 방식 점수 계산
        if (userMethod === "모두선택" || recruit.method === userMethod) {
          score += 2;
        }

        // 대면 또는 모두선택일 경우 지역 점수 계산
        if (
          (recruit.method === "대면" || recruit.method === "모두선택") &&
          recruit.region === userRegion
        ) {
          score += 1;
        }

        return {
          ...recruit,
        };
      });

      // 최고 점수의 구인글을 추천
      const topRecruit = scoredRecruits.reduce(
        (max, recruit) => (recruit.score > max.score ? recruit : max),
        scoredRecruits[0]
      );

      recommendedRecruits.push({ field, recommendation: topRecruit });
    }

    res.status(200).json(recommendedRecruits);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "맞춤 추천 중 오류가 발생했습니다." });
  }
});

module.exports = router;
