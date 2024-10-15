const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

router.get("/member/:roomId", async (req, res) => {
  /**
    #swagger.tags = ['Chat']
    #swagger.summary = '채팅 멤버 조회'
  */

  const roomId = req.params.roomId;

  try {
    // roomId 행 가져오기
    const [members] = await pool.query(
      "SELECT * FROM chatRoom WHERE chatRoomId = ?",
      [roomId]
    );

    // 채팅방이 존재하지 않음
    if (members.length === 0) {
      return res.status(404).json({ message: "잘못된 채팅방 id 입니다." });
    }

    return res.status(200).json({
      memberId: members[0].memberId,
      opponentId: members[0].opponentId,
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the chatRoom" });
  }
});

router.get("/allmessages/:roomId", async (req, res) => {
  /**
    #swagger.tags = ['Chat']
    #swagger.summary = '채팅 내역 조회'
  */
  const roomId = req.params.roomId;

  try {
    // roomId 행 가져오기
    const [room] = await pool.query(
      "SELECT * FROM chatRoom WHERE chatRoomId = ?",
      [roomId]
    );
    // 채팅방이 존재하지 않음
    if (room.length === 0) {
      return res.status(404).json({ message: "잘못된 채팅방 id 입니다." });
    }

    // 메세지 내역 가져오기
    const [messages] = await pool.query(
      "SELECT * FROM chatMessage WHERE chatRoomId = ?",
      [roomId]
    );
    if (messages.length === 0) {
      return res.status(200).json([]);
    }

    return res.status(200).json(messages);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the chatRoom" });
  }
});

module.exports = router;
