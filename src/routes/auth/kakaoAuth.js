const express = require("express");
const router = express.Router();
const axios = require("axios");
const queryString = require("query-string");

// 환경 변수 파일을 조건에 따라 로드하는 함수
const loadEnv = (env) => {
  if (env === "production") {
    dotenv.config({ path: "./.env.production" });
  } else {
    dotenv.config({ path: "./.env.development" });
  }
};

router.get("/kakao/token", async (req, res) => {
  const environment = req.headers["environment"] || "development";
  loadEnv(environment); // 환경 변수 파일 로드

  const { REST_API_KEY, REDIRECT_URI, CLIENT_SECRET } = process.env;

  const code = req.query.code;

  if (!code) {
    return res.status(400).send("Authorization code is required");
  }

  try {
    const tokenResponse = await axios.post(
      "https://kauth.kakao.com/oauth/token",
      queryString.stringify({
        grant_type: "authorization_code",
        client_id: REST_API_KEY,
        redirect_uri: REDIRECT_URI,
        code,
        client_secret: CLIENT_SECRET, // 만약 client_secret을 사용한다면
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    const userResponse = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      timeout: 5000,
    });

    res.json(userResponse.data);
  } catch (err) {
    console.error("Error occurred:", err.message);
    if (err.response) {
      console.error("Response data:", err.response.data);
    }
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
