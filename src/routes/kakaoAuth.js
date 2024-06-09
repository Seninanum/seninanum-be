const express = require("express");
const router = express.Router();
const axios = require("axios");
const jwt = require("jsonwebtoken");

router.get("/", async (req, res) => {
  const REST_API_KEY = process.env.REST_API_KEY;
  const REDIRECT_URI = process.env.REDIRECT_URI;
  // const JWT_SECRET = process.env.JWT_SECRET;

  const code = req.query.code;

  try {
    console.log("Requesting access token from Kakao...");
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
    console.log("Access token response:", tokenResponse.data);
    const accessToken = tokenResponse.data.access_token;

    console.log("Requesting user information from Kakao...");
    const userResponse = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      timeout: 5000,
    });

    console.log("User information response:", userResponse.data);

    res.json(userResponse.data);
    // const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    //   expiresIn: "1h",
    // });

    // res.header("Authorization", `Bearer ${token}`);
    // res.json({ token });
  } catch (err) {
    console.log(err);
    // console.error("Error occurred:", err.message);
    // if (err.response) {
    //   console.error("Error response data:", err.response.data);
    //   console.error("Error response status:", err.response.status);
    //   console.error("Error response headers:", err.response.headers);
    // }
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
