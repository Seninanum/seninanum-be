const express = require("express");
const router = express.Router();
const pool = require("../../database/db");
const { fetchPaginatedMessages } = require("../../util/fetchPage");

router.get("/info/:roomId", async (req, res) => {
  /**
    #swagger.tags = ['Chat']
    #swagger.summary = '채팅 멤버 조회'
  */

  const roomId = req.params.roomId;
  const userId = req.user.profileId;

  try {
    // roomId 행 가져오기
    const [room] = await pool.query(
      "SELECT * FROM chatRoom WHERE chatRoomId = ?",
      [roomId]
    );
    if (room.length === 0) {
      return res.status(404).json({ message: "잘못된 채팅방 id 입니다." });
    }
    // 모든 id 양수화
    const memberId = Math.abs(room[0].memberId);
    const opponentId = Math.abs(room[0].opponentId);

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

    // 상대방이 작성한 recruitId 목록 조회
    const [recruitIds] = await pool.query(
      "SELECT recruitId,title FROM recruit WHERE profileId = ?",
      [memberId]
    );
    const recruitIdArray = recruitIds.map((r) => r.recruitId);

    // application 테이블에서 내 profileId와 상대방의 recruitId로 조회하여 title도 포함한 응답 생성
    let appliedRecruitIds = [];
    if (recruitIdArray.length > 0) {
      const [applications] = await pool.query(
        "SELECT recruitId FROM application WHERE profileId = ? AND recruitId IN (?)",
        [userId, recruitIdArray]
      );

      const appliedRecruitIdArray = applications.map((app) => app.recruitId);

      // recruitId와 title을 포함하여 응답 생성
      appliedRecruitIds = recruitIds
        .filter((r) => appliedRecruitIdArray.includes(r.recruitId))
        .map((r) => ({ recruitId: r.recruitId, title: r.title }));
    }

    if (userId === memberId) {
      return res.status(200).json({
        memberProfile,
        opponentProfile,
        roomStatus: room[0].roomStatus,
        appliedRecruitIds,
      });
    } else {
      return res.status(200).json({
        memberProfile: opponentProfile,
        opponentProfile: memberProfile,
        roomStatus: room[0].roomStatus,
        appliedRecruitIds,
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
    #swagger.summary = '전체 채팅 내역 조회'
  */
  const roomId = req.params.roomId;
  const myProfileId = req.user.profileId;

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

    // limit값 가져오기
    const [limitMessageId] = await pool.query(
      "SELECT limitMessageId FROM chatRoomMember WHERE profileID = ? AND chatRoomId = ?",
      [myProfileId, roomId]
    );
    // 메세지 내역 가져오기
    const [messages] = await pool.query(
      "SELECT * FROM chatMessage WHERE chatRoomId = ? AND chatMessageId > ?",
      [roomId, limitMessageId[0]?.limitMessageId || 0]
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

router.get("/unread/:roomId", async (req, res) => {
  /**
    #swagger.tags = ['Chat']
    #swagger.summary = '채팅 내역 조회'
  */
  const roomId = req.params.roomId;
  const profileId = req.user.profileId;

  try {
    // roomId 행 가져오기
    const [room] = await pool.query(
      "SELECT lastReadMessageId FROM chatRoomMember WHERE chatRoomId = ? AND profileId = ?",
      [roomId, profileId]
    );
    // 채팅방이 존재하지 않음
    if (room.length === 0) {
      return res.status(404).json({ message: "잘못된 채팅방 id 입니다." });
    }

    // 메세지 내역 가져오기
    const [messages] = await pool.query(
      "SELECT * FROM chatMessage WHERE chatMessageId > ? AND chatRoomId = ? ",
      [room[0].lastReadMessageId, roomId]
    );
    if (messages.length === 0) {
      return res.status(200).json([]);
    }

    return res.status(200).json(messages);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.get("/:roomId", async (req, res) => {
  /**
    #swagger.tags = ['Chat']
    #swagger.summary = '채팅 페이지 개수 반환'
  */
  const profileId = req.user.profileId;
  const { roomId } = req.params; // 경로 매개변수로 roomId 가져오기

  try {
    // roomId 행 가져오기
    const [room] = await pool.query(
      "SELECT limitMessageId FROM chatRoomMember WHERE chatRoomId = ? AND profileId = ?",
      [roomId, profileId]
    );
    // 채팅방이 존재하지 않음
    if (room.length === 0) {
      return res.status(404).json({ message: "잘못된 채팅방 id 입니다." });
    }

    // 총 페이지 개수 계산
    const [[{ totalMessages }]] = await pool.query(
      "SELECT COUNT(*) AS totalMessages FROM chatMessage WHERE chatRoomId = ? AND chatMessageId > ?",
      [roomId, room[0]?.limitMessageId || 0]
    );
    // 총 페이지 수를 계산합니다.
    const totalPages = Math.ceil(totalMessages / 10);

    res.status(200).json({ totalPages });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: "채팅방 페이지를 계산하는 중 오류가 발생했습니다." });
  }
});

router.get("/message/:roomId", async (req, res) => {
  /**
    #swagger.tags = ['Chat']
    #swagger.summary = '채팅 페이지 별 메세지 내역 반환'
  */

  const profileId = req.user.profileId;
  const { roomId } = req.params;
  const { page = 0 } = req.query;
  try {
    const messages = await fetchPaginatedMessages(
      pool,
      "chatMessage",
      roomId,
      profileId,
      page
    );

    res.status(200).json({ messages });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error: "채팅방 페이지의 메시지 내역을 가져오는 중 오류가 발생했습니다.",
    });
  }
});

router.post("/disconnect", async (req, res) => {
  const { roomId, lastReadMessageId } = req.body;
  const memberId = req.user.profileId;

  try {
    if (lastReadMessageId === null)
      return res.status(200).json({ message: "NOMESSAGE" });

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
