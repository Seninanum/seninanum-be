const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

router.post("/disconnect", async (req, res) => {
  const { roomId, lastReadMessageId } = req.body;
  const memberId = req.user.profileId;

  try {
    // 마지막으로 읽은 메세지 id 저장
    await pool.query(
      "INSERT INTO chatRoomMember (chatRoomId, profileId, lastReadMessageId) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE lastReadMessageId = ?",
      [roomId, memberId, lastReadMessageId, lastReadMessageId]
    );

    return res.status(200).json({ message: "SUCCESS" });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "An error occurred while updating the chatRoomMember" });
  }
});

module.exports = router;
