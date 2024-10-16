const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

router.post("/disconnect", async (req, res) => {
  const { roomId, memberId, lastReadMessageId } = req.body;

  try {
    console.log(roomId, memberId, lastReadMessageId);
    return res.status(200).json({ message: "수신성공" });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the chatRoom" });
  }
});

module.exports = router;
