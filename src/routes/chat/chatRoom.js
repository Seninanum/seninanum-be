const express = require("express");
const router = express.Router();
const pool = require("../../database/db");
const { validateRequestBody } = require("../../middlewares/requestBody");
router.post("/create", validateRequestBody, async (req, res) => {
  /**
    #swagger.tags = ['Chatroom']
    #swagger.summary = '채팅 방 생성'
  */

  const { oppProfileId } = req.body;
  const myProfileId = req.user.profileId;

  // id가 같으면 경고 메시지 반환
  if (oppProfileId === myProfileId) {
    return res.status(400).json({
      message: "자기 자신과 채팅방을 생성할 수 없습니다.",
    });
  }

  // 데이터베이스 쿼리 함수
  const getLastMessageId = async () => {
    const [latestMessage] = await pool.query(
      "SELECT chatMessageId FROM chatMessage ORDER BY chatMessageId DESC LIMIT 1"
    );
    return latestMessage.length > 0 ? latestMessage[0].chatMessageId : 0;
  };

  const setLastReadMessage = async (chatRoomId, profileId) => {
    const lastReadMessageId = await getLastMessageId();
    await pool.query(
      `INSERT INTO chatRoomMember (chatRoomId, profileId, lastReadMessageId)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE lastReadMessageId = ?`,
      [chatRoomId, profileId, lastReadMessageId, lastReadMessageId]
    );
  };

  const createChatRoom = async (myProfileId, oppProfileId) => {
    const [result] = await pool.query(
      "INSERT INTO chatRoom (roomStatus, memberId, opponentId) VALUES (?, ?, ?)",
      ["ACTIVE", myProfileId, oppProfileId]
    );
    const chatRoomId = result.insertId;
    await setLastReadMessage(chatRoomId, myProfileId);
    await setLastReadMessage(chatRoomId, oppProfileId);
    return chatRoomId;
  };

  try {
    // 기존 채팅방 확인
    const [existingChatroom] = await pool.query(
      `SELECT chatRoomId, roomStatus, memberId, opponentId 
        FROM chatRoom
        WHERE (ABS(memberId) = ? AND ABS(opponentId) = ?) 
          OR (ABS(memberId) = ? AND ABS(opponentId) = ?)`,
      [myProfileId, oppProfileId, oppProfileId, myProfileId]
    );

    if (existingChatroom.length === 0) {
      // 새 채팅방 생성
      const chatRoomId = await createChatRoom(myProfileId, oppProfileId);
      return res.status(201).json({
        chatRoomId,
        memberId: myProfileId,
        opponentId: oppProfileId,
        message: "채팅방이 새로 생성되었습니다.",
      });
    } else {
      // 기존 채팅방 활성화
      const chatRoom = existingChatroom[0];
      if (chatRoom.roomStatus === "INACTIVE") {
        await pool.query(
          "UPDATE chatRoom SET roomStatus = 'ACTIVE' WHERE chatRoomId = ?",
          [chatRoom.chatRoomId]
        );
        await setLastReadMessage(chatRoom.chatRoomId, myProfileId);
      }
      return res.status(200).json({
        chatRoomId: chatRoom.chatRoomId,
        memberId: chatRoom.memberId,
        opponentId: chatRoom.opponentId,
        message: "기존 채팅방을 반환합니다.",
      });
    }
  } catch (error) {
    console.error("채팅방 생성 중 오류:", error);
    res.status(500).json({
      error: "채팅방을 생성하는 중에 오류가 발생했습니다.",
    });
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
      return res.status(200).json([]);
    }

    // 사용자 기준으로 응답값 수정
    const modifiedChatrooms = await Promise.all(
      existingChatroom.map(async (room) => {
        // 상대방 Id
        const opponentId = Math.abs(
          room.memberId === myProfileId ? room.opponentId : room.memberId
        );

        // 방 이름 (상대방 닉네임)
        const [profiles] = await pool.query(
          "SELECT * FROM profile WHERE profileId = ?",
          [opponentId]
        );

        // 마지막으로 보낸 메세지
        // 마지막으로 보낸 메세지 시간
        const [message] = await pool.query(
          "SELECT * FROM chatMessage WHERE chatRoomId = ? ORDER BY chatMessageId DESC LIMIT 1",
          [room.chatRoomId]
        );

        // 채팅 메세지 없음 처리
        if (message.length === 0) {
          return {
            chatRoomId: room.chatRoomId,
            chatMessageId: "",
            profile: profiles[0]?.profile,
            userType: profiles[0]?.userType,
            roomName: profiles[0]?.nickname || "Unknown",
            // roomStatus: room.roomStatus,
            senderId: "",
            myProfileId: myProfileId,
            senderType: "",
            lastMessage: "",
            unreadMessageCount: 0,
            createdAt: room.createdAt,
          };
        } else {
          // 안 읽은 메세지 개수 계산
          const [readMessage] = await pool.query(
            "SELECT * FROM chatRoomMember WHERE chatRoomId=? AND profileId=? ",
            [room.chatRoomId, myProfileId]
          );
          const lastReadMessageId =
            readMessage.length > 0 ? readMessage[0].lastReadMessageId : null;
          const [unreadMessages] = await pool.query(
            "SELECT COUNT(*) AS unreadCount FROM chatMessage WHERE chatRoomId = ? AND chatMessageId > ?",
            [room.chatRoomId, lastReadMessageId]
          );

          return {
            chatRoomId: room.chatRoomId,
            chatMessageId: message[0].chatMessageId,
            profile: profiles[0]?.profile,
            userType: profiles[0]?.userType,
            roomName: profiles[0]?.nickname || "Unknown",
            // roomStatus: room.roomStatus,
            lastMessage: message[0].chatMessage,
            senderId: message[0].senderId,
            senderType: message[0].senderType,
            myProfileId: myProfileId,
            unreadMessageCount: unreadMessages[0].unreadCount,
            createdAt: message[0].createdAt,
          };
        }
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
