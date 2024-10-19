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

  // 채팅방 생성 또는 기존 채팅방 확인 함수
  async function setLastReadMessage(chatRoomId, profileId) {
    // 메세지의 마지막 id를 lastMessageId 값으로 저장
    const [latestMessage] = await pool.query(
      "SELECT chatMessageId FROM chatMessage ORDER BY chatMessageId DESC LIMIT 1"
    );
    const lastReadMessageId =
      latestMessage.length > 0 ? latestMessage[0].chatMessageId : 0;
    await pool.query(
      "INSERT INTO chatRoomMember (chatRoomId, profileId, lastReadMessageId) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE lastReadMessageId = ?",
      [chatRoomId, profileId, lastReadMessageId, lastReadMessageId]
    );
  }

  try {
    // 생성되어있는 방이 있는지 확인
    const [existingChatroom] = await pool.query(
      "SELECT * FROM chatRoom WHERE ABS(memberId) = ABS(?) OR ABS(opponentId) = ABS(?)",
      [myProfileId, myProfileId]
    );

    if (existingChatroom.length === 0) {
      // 새로 채팅방 생성
      const [result] = await pool.query(
        "INSERT INTO chatRoom (roomStatus, memberId, opponentId) VALUES (?, ?, ?)",
        ["ACTIVE", myProfileId, oppProfileId]
      );

      // 마지막으로 읽은 메세지 설정
      await setLastReadMessage(result.insertId, myProfileId);
      await setLastReadMessage(result.insertId, oppProfileId);

      // 생성된 채팅방의 ID 반환
      return res.status(200).json({
        chatRoomId: result.insertId,
        memberId: myProfileId,
        opponentId: oppProfileId,
        message: "채팅방이 생성되었습니다.",
      });
    } else {
      // 기존에 생성되어있던 채팅방 ID 반환
      const chatRoomId = existingChatroom[0].chatRoomId;

      if (existingChatroom[0].roomStatus === "INACTIVE") {
        // chatRoom 테이블 업데이트
        await pool.query(
          "UPDATE chatRoom SET roomStatus = 'ACTIVE' WHERE chatRoomId = ?",
          [chatRoomId]
        );

        // chatRoomMember 테이블 업데이트
        await pool.query(
          "UPDATE chatRoomMember SET profileId = ? WHERE ABS(profileId) = ? AND chatRoomId = ?",
          [myProfileId, myProfileId, chatRoomId]
        );
      }

      // 마지막으로 읽은 메세지 설정
      await setLastReadMessage(chatRoomId, myProfileId);

      // 기존 채팅방 반환
      return res.status(200).json({
        chatRoomId: chatRoomId,
        memberId: existingChatroom[0].memberId,
        opponentId: existingChatroom[0].opponentId,
        message: "기존 채팅방이 반환되었습니다.",
      });
    }
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
          [+opponentId]
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
