const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

router.post("/create", async (req, res) => {
  /**
    #swagger.tags = ['Chatroom']
    #swagger.summary = '채팅 방 생성'
  */

  // 나리는 경력프로필 아이디, 동백은 구인글 아이디
  const { contentId } = req.body;
  const userId = req.user.userId;

  let opponentId;
  // 상대방 유저 아이디 가져오기
  if (req.user.userType === "dong") {
    const [opponents] = await pool.query(
      "SELECT userId FROM recruit WHERE recruitId = ?",
      [contentId]
    );
    if (opponents.length > 0) {
      opponentId = opponents[0].userId;
    } else {
      return res.status(404).json({ message: "상대방을 찾을 수 없습니다." });
    }
  } else {
    const [opponents] = await pool.query(
      "SELECT userId FROM careerProfile WHERE profileId = ?",
      [contentId]
    );
    if (opponents.length > 0) {
      opponentId = opponents[0].userId;
    } else {
      return res.status(404).json({ message: "상대방을 찾을 수 없습니다." });
    }
  }

  // opponentId와 userId가 같으면 경고 메시지 반환
  if (opponentId === userId) {
    return res.status(400).json({
      message: "잘못된 접근입니다.",
    });
  }

  // 방 이름
  const [roomNames] = await pool.query("SELECT * FROM user WHERE userId = ?", [
    userId,
  ]);
  const roomName = roomNames[0].nickname;

  // 생성되어있는 방이 있는지 확인
  try {
    const [existingChatroom] = await pool.query(
      "SELECT * FROM chatRoom WHERE memberId = ? OR opponentId = ?",
      [userId, userId]
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
