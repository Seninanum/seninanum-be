const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

router.post("/disconnect", async (req, res) => {
  const { roomId, memberId, lastReadMessageId } = req.body;

  try {
    console.log(req.body);
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
