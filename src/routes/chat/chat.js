const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

router.get("/member/:roomId", async (req, res) => {
  /**
    #swagger.tags = ['Chat']
    #swagger.summary = '채팅 멤버 조회'
  */

  const roomId = req.params.roomId;
  const userId = req.user.profileId;

  try {
    // roomId 행 가져오기
    const [members] = await pool.query(
      "SELECT * FROM chatRoom WHERE chatRoomId = ?",
      [roomId]
    );
    if (members.length === 0) {
      return res.status(404).json({ message: "잘못된 채팅방 id 입니다." });
    }
    // 모든 id 양수화
    const memberId = Math.abs(members[0].memberId);
    const opponentId = Math.abs(members[0].opponentId);

    // profile 가져오기
    const [memberProfiles] = await pool.query(
      "SELECT profileId, userType, nickname, profile FROM profile WHERE profileId IN (?, ?)",
      [memberId, opponentId]
    );
    if (memberProfiles.length !== 2) {
      return res
        .status(404)
        .json({ message: "해당 멤버의 프로필을 찾을 수 없습니다." });
    }
    const memberProfile = memberProfiles.find(
      (profile) => profile.profileId === memberId
    );
    const opponentProfile = memberProfiles.find(
      (profile) => profile.profileId === opponentId
    );

    if (userId === memberId) {
      return res.status(200).json({
        memberProfile,
        opponentProfile,
      });
    } else {
      return res.status(200).json({
        memberProfile: opponentProfile,
        opponentProfile: memberProfile,
      });
    }
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

    console.log("확인용>>>>>>>>>>>", messages[0].createdAt);

    return res.status(200).json(messages);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the chatRoom" });
  }
});

module.exports = router;
