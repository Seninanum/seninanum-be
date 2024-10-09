const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

router.post("/create", async (req, res) => {
  /**
    #swagger.tags = ['Chatroom']
    #swagger.summary = '채팅 방 생성'
  */

  const { oppProfileId } = req.body;
  const myProfileId = req.user.profileId;

  // id가 같으면 경고 메시지 반환
  if (oppProfileId == myProfileId) {
    return res.status(400).json({
      message: "잘못된 접근입니다.",
    });
  }

  // 생성되어있는 방이 있는지 확인
  try {
    const [existingChatroom] = await pool.query(
      "SELECT * FROM chatRoom WHERE memberId = ? OR opponentId = ?",
      [myProfileId, myProfileId]
    );

    if (existingChatroom.length === 0) {
      // 새로 프로필 생성
      const [result] = await pool.query(
        "INSERT INTO chatRoom (roomStatus, memberId, opponentId) VALUES (?, ?, ?, ?)",
        ["ACTIVE", myProfileId, oppProfileId]
      );

      // 생성된 채팅방의 ID 반환
      return res.status(200).json({
        chatRoomId: result.insertId,
        memberId: myProfileId,
        opponentId: oppProfileId,
        message: "채팅방이 생성되었습니다.",
      });
    }
    // 기존에 생성되어있던 채팅방 ID 반환
    return res.status(200).json({
      chatRoomId: existingChatroom[0].chatRoomId,
      memberId: existingChatroom[0].myProfileId,
      opponentId: existingChatroom[0].oppProfileId,
      message: "기존 채팅방이 반환되었습니다.",
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the chatRoom" });
  }
});

router.get("/list", async (req, res) => {
  /**
    #swagger.tags = ['Chatroom']
    #swagger.summary = '채팅 방 목록 조회'
  */

  const myProfileId = req.user.profileId;

  try {
    // chatRoom에 해당하는 방 모두 가져오기
    const [existingChatroom] = await pool.query(
      "SELECT * FROM chatRoom WHERE memberId = ? OR opponentId = ?",
      [myProfileId, myProfileId]
    );

    // 채팅 목록 없음
    if (existingChatroom.length === 0) {
      return res.status(404).json({ message: "생성된 채팅방이 없습니다." });
    }

    // 사용자 기준으로 응답값 수정
    const modifiedChatrooms = await Promise.all(
      existingChatroom.map(async (room) => {
        // myProfileId가 memberId와 같은지 확인
        const opponentId =
          room.memberId === myProfileId ? room.opponentId : room.memberId;

        // 방 이름 (상대방 닉네임)
        const [roomNames] = await pool.query(
          "SELECT nickname FROM profile WHERE profileId = ?",
          [opponentId]
        );
        const roomName = roomNames[0]?.nickname || "Unknown";

        return {
          chatRoomId: room.chatRoomId,
          roomName: roomName,
          roomStatus: room.roomStatus,
          opponentId: opponentId,
          createdAt: room.createdAt,
        };
      })
    );

    return res.status(200).json(modifiedChatrooms);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the chatRoom" });
  }
});

module.exports = router;
