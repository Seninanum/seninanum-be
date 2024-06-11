const express = require("express");
const router = express.Router();
const axios = require("axios");

router.get("/kakao/token", async (req, res) => {
  const REST_API_KEY = process.env.REST_API_KEY;
  const REDIRECT_URI = process.env.REDIRECT_URI;

  const code = req.query.code;

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

    const userResponse = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      timeout: 5000,
    });

    res.json(userResponse.data);
  } catch (err) {
    console.log(err);
    // console.error("Error occurred:", err.message);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
