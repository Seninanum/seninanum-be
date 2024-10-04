const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

router.post("/create", async (req, res) => {
  /**
    #swagger.tags = ['Chatroom']
    #swagger.summary = '채팅 방 생성'
  */

  const { opponentId } = req.body;
  const userId = req.user.userId;

  // 방 이름
  const [roomNames] = await pool.query("SELECT * FROM user WHERE userId = ?", [
    userId,
  ]);
  const roomName = roomNames[0].nickname;

  // 생성되어있는 방이 있는지 확인
  try {
    const [existingChatroom] = await pool.query(
      "SELECT * FROM chatRoom WHERE memberId = ? AND opponentId = ?",
      [userId, opponentId]
    );

    if (existingChatroom.length === 0) {
      // 새로 프로필 생성
      const [result] = await pool.query(
        "INSERT INTO chatRoom (roomName, roomStatus, memberId, opponentId) VALUES (?, ?, ?, ?)",
        [roomName, "ACTIVE", userId, opponentId]
      );

      // 생성된 채팅방의 ID 반환
      return res.status(200).json({
        chatRoomId: result.insertId,
        memberId: userId,
        opponentId: opponentId,
        message: "채팅방이 생성되었습니다.",
      });
    }
    // 기존에 생성되어있던 채팅방 ID 반환
    return res.status(200).json({
      chatRoomId: existingChatroom[0].chatRoomId,
      memberId: existingChatroom[0].memberId,
      opponentId: existingChatroom[0].opponentId,
      message: "기존 채팅방이 반환되었습니다.",
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the chatRoom" });
  }
});

router.get("/memberIds/");

module.exports = router;
