const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

router.post("/career", async (req, res) => {
  const {
    userId,
    profileImage,
    certificate,
    introduce,
    service,
    meetingType,
    priceType,
    price,
    region,
    field,
  } = req.body;

  try {
    const [user] = await pool.query("SELECT * FROM user WHERE userId = ?", [
      userId,
    ]);
    if (user.length === 0) {
      return res.status(400).json({ error: "유효하지 않은 userId입니다." });
    }

    const [result] = await pool.query(
      "INSERT INTO careerProfile (userId, profileImage, certificate, introduce, service, meetingType, priceType, price, region, field) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        userId,
        profileImage,
        certificate,
        introduce,
        service,
        meetingType,
        priceType,
        price,
        region,
        field,
      ]
    );

    res.status(201).json({ message: "경력프로필이 등록되었습니다." });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the careerProfile" });
  }
});

module.exports = router;
