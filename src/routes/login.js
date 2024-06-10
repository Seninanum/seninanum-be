const express = require("express");
const router = express.Router();
const pool = require("../database/db");
const { generateToken } = require("../middlewares/jwt");

router.post("/", async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "값이 존재해야 합니다." });
  }

  try {
    const [rows] = await pool.query("SELECT * FROM user WHERE userId = ?", [
      userId,
    ]);

    if (rows.length > 0) {
      const token = generateToken({ userId: rows[0].userId });

      return res
        .status(200)
        .json({ message: "로그인 되었습니다.", token: token });
    } else {
      return res.status(404).json({ message: "존재하지 않는 계정입니다." });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "An error occurred while checking the user ID" });
  }
});

module.exports = router;
