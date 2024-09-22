const express = require("express");
const router = express.Router();
const axios = require("axios");

//카카오 사용자 정보 요청
router.get("/kakao", async (req, res) => {
  /**
    #swagger.tags = ['Auth']
    #swagger.summary = '카카오 사용자 정보 요청'
   */

  const REST_API_KEY = process.env.REST_API_KEY;
  const REDIRECT_URI =
    process.env.NODE_ENV === "development"
      ? process.env.DEV_REDIRECT_URI
      : process.env.PRD_REDIRECT_URI;

  const code = req.query.code;

  // 카카오 Access Token 요청
  try {
    const tokenResponse = await axios.post(
      "https://kauth.kakao.com/oauth/token",
      null,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        },
        params: {
          grant_type: "authorization_code",
          client_id: REST_API_KEY,
          redirect_uri: REDIRECT_URI,
          code: code,
        },
      }
    );
    const accessToken = tokenResponse.data.access_token;

    // 카카오 사용자 정보 요청
    const userResponse = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      timeout: 5000,
    });

    //반환값
    res.json(userResponse.data);
  } catch (err) {
    console.error("Error occurred:", err);

    // 특정 속성들을 로그에 출력
    console.error("Error message:", err.message); // 기본 메시지
    console.error("Error stack:", err.stack); // 스택 추적
    console.error("Error config:", err.config); // Axios 요청 설정 (만약 Axios 요청에서 발생한 오류라면)
    if (err.response) {
      console.error("Response data:", err.response.data); // 서버에서 반환된 응답 데이터
      console.error("Response status:", err.response.status); // 서버에서 반환된 상태 코드
      console.error("Response headers:", err.response.headers); // 서버에서 반환된 헤더
    } else if (err.request) {
      console.error("Request data:", err.request); // 서버에 도달하지 못한 요청 데이터
    } else {
      console.error("Error details:", err.message); // 요청이 설정되는 동안 발생한 오류
    }
    // 클라이언트에게 500 내부 서버 오류 응답 전송
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
