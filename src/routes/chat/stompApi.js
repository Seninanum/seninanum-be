const pool = require("../../database/db");

// 둘 다 chatRoomSession안에 있을 때 읽음처리
const isBothInSession = async (roomId) => {
  try {
    const [result] = await pool.query(
      "SELECT profileId FROM chatRoomSession WHERE chatRoomId = ?",
      [roomId]
    );
    console.log("session result>>>>>>>>>>>", result);
    return result.length === 2 ? 0 : 1;
  } catch (error) {
    console.error("Error while processing connected event: ", error);
  }
};

// 채팅방 들어왔을 때 상대방 이전 메세지는 모두 읽음처리
const setUnreadToRead = async (roomId, memberId) => {
  try {
    await pool.query(
      "UPDATE chatMessage SET unreadCount = ? WHERE chatRoomId = ? AND senderID != ?",
      [0, roomId, memberId] // 마지막 ?에 unreadCount != 0 조건 추가
    );
  } catch (error) {
    console.error("Error while processing connected event: ", error);
  }
};

const handleConnected = async (stompServer, sessionId, headers) => {
  try {
    // session 등록하기
    await pool.query(
      "INSERT INTO chatRoomSession (sessionId, profileId, chatRoomId) VALUES (?, ?, ?)",
      [sessionId, headers.memberId, headers.chatRoomId]
    );

    // 읽음 처리
    setUnreadToRead(headers.chatRoomId, headers.memberId);

    /*
      방을 나갔다가
      다시 들어온
      경우
    */

    // id가 마이너스인 chatRoom 정보 가져오기
    const [existingChatroom] = await pool.query(
      "SELECT * FROM chatRoom WHERE ABS(memberId) = ABS(?) AND memberId < 0 OR ABS(opponentId) = ABS(?) AND opponentId < 0",
      [headers.memberId, headers.memberId]
    );

    // 나갔다 다시 들어온 방인 경우
    if (existingChatroom.length > 0) {
      // chatRoom 사용자 id값 양수로 변경
      if (existingChatroom[0].memberId < 0) {
        await pool.query(
          "UPDATE chatRoom SET memberId = ? WHERE chatRoomId = ?",
          [headers.memberId, headers.chatRoomId]
        );
      } else if (existingChatroom[0].opponentId < 0) {
        await pool.query(
          "UPDATE chatRoom SET opponentId = ? WHERE chatRoomId = ?",
          [headers.memberId, headers.chatRoomId]
        );
      }

      // '채팅방에 들어왔습니다' 메세지 생성 및 전송
      const roomId = headers.chatRoomId;
      const messageBody = {
        senderId: headers.memberId,
        chatMessage: "채팅방에 들어왔습니다.",
        senderType: "COME",
      };

      // DB에 메시지 저장
      const [insertResult] = await pool.query(
        "INSERT INTO chatMessage (chatRoomId, senderId, chatMessage, senderType, unreadCount) VALUES (?, ?, ?, ?, ?)",
        [
          roomId,
          messageBody.senderId,
          messageBody.chatMessage,
          messageBody.senderType,
          1,
        ]
      );

      // limitMessageId 설정하기
      await pool.query(
        "UPDATE chatRoomMember SET limitMessageId = ? WHERE profileId = ? AND chatRoomId = ?",
        [insertResult.insertId, headers.memberId, headers.chatRoomId]
      );

      // 메시지 전송
      stompServer.send(
        `/topic/chat/${roomId}`,
        {},
        JSON.stringify(messageBody)
      );
    }
  } catch (error) {
    console.error("Error while processing connected event: ", error);
  }
};

const handleSendMessage = async (stompServer, messageBody, roomId) => {
  try {
    const UNREAD_COUNT = await isBothInSession(roomId);

    // 메시지 디코딩
    const binaryMessage = new Uint8Array(
      Object.values(messageBody.chatMessage)
    );
    const decodedMessage = new TextDecoder().decode(binaryMessage);

    // DB에 메시지 저장
    const [result] = await pool.query(
      "INSERT INTO chatMessage (chatRoomId, senderId, chatMessage, senderType, unreadCount) VALUES (?, ?, ?, ?, ?)",
      [
        roomId,
        messageBody.senderId,
        decodedMessage,
        messageBody.senderType,
        UNREAD_COUNT,
      ]
    );

    if (!result || !result.insertId) {
      console.warn("DB 저장에 실패했거나, result 값이 없습니다.");
      return;
    }

    // 방금 저장한 메시지의 createdAt 값을 조회
    const [createdAtResult] = await pool.query(
      "SELECT createdAt FROM chatMessage WHERE chatMessageId = ?",
      [result.insertId]
    );

    // 메시지 본문 업데이트
    const createdAt = new Date(createdAtResult[0].createdAt);
    messageBody.createdAt = createdAt.toISOString().split(".")[0];
    messageBody.chatMessageId = result.insertId;
    messageBody.unreadCount = UNREAD_COUNT;
    messageBody.chatRoomId = roomId;
    delete messageBody.receiverId;

    // 메시지 전송
    stompServer.send(`/topic/chat/${roomId}`, {}, JSON.stringify(messageBody));
  } catch (error) {
    console.error("Error handling USER message:", error);
  }
};

const handleSendLeave = async (stompServer, messageBody, roomId) => {
  try {
    // 사용자가 나가려는 방이 존재하는지 확인
    const [existingChatroom] = await pool.query(
      "SELECT * FROM chatRoom WHERE memberId = ? OR opponentId = ?",
      [messageBody.senderId, messageBody.senderId]
    );

    if (existingChatroom.length > 0) {
      // LEAVE 메시지 저장
      const [insertResult] = await pool.query(
        "INSERT INTO chatMessage (chatRoomId, senderId, chatMessage, senderType, unreadCount) VALUES (?, ?, ?, ?, ?)",
        [
          roomId,
          messageBody.senderId,
          messageBody.chatMessage,
          messageBody.senderType,
          1,
        ]
      );

      // chatRoom: 나간 사람의 id 값을 -1로, roomStatus를 'INACTIVE'로 업데이트
      if (existingChatroom[0].memberId == messageBody.senderId) {
        await pool.query(
          `UPDATE chatRoom SET memberId = ?, roomStatus = 'INACTIVE' WHERE chatRoomId = ?`,
          [-messageBody.senderId, roomId]
        );
      } else if (existingChatroom[0].opponentId == messageBody.senderId) {
        await pool.query(
          `UPDATE chatRoom SET opponentId = ?, roomStatus = 'INACTIVE' WHERE chatRoomId = ?`,
          [-messageBody.senderId, roomId]
        );
      }

      // 둘 다 나간 방(둘 다 마이너스인 방)인지 확인
      const [roomCheck] = await pool.query(
        `SELECT * FROM chatRoom WHERE chatRoomId = ? AND memberId < 0 AND opponentId < 0`,
        [roomId]
      );
      if (roomCheck.length > 0) {
        // 둘 다 나간 방 : chatRoomMember과 chatRoom에서 해당 roomId 행 지우기
        await pool.query(`DELETE FROM chatRoomMember WHERE chatRoomId = ?`, [
          roomId,
        ]);
        await pool.query(`DELETE FROM chatRoom WHERE chatRoomId = ?`, [roomId]);
      } else {
        // 사용자만 나감 (상대방은 존재) : limitMessageId 설정
        await pool.query(
          "UPDATE chatRoomMember SET limitMessageId = ? WHERE profileId = ? AND chatRoomId = ?",
          [insertResult.insertId, messageBody.senderId, roomId]
        );
      }

      // 메시지 전달
      stompServer.send(
        `/topic/chat/${roomId}`,
        {},
        JSON.stringify(messageBody)
      );
    }
  } catch (error) {
    console.error("Error handling LEAVE message:", error);
  }
};

const handleDisconnected = async (sessionId) => {
  try {
    // chatRoomSession에서 sessionId가 일치하는 행 삭제
    await pool.query("DELETE FROM chatRoomSession WHERE sessionId = ?", [
      sessionId,
    ]);
  } catch (error) {
    console.error("Error while deleting session from chatRoomSession:", error);
  }
};

module.exports = {
  handleConnected,
  handleSendMessage,
  handleSendLeave,
  handleDisconnected,
};
