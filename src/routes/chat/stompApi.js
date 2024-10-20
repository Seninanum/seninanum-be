const express = require("express");
// const router = express.Router();
const pool = require("../../database/db");

const handleConnected = async (stompServer, sessionId, headers) => {
  console.log("connect headers: ", headers);

  const connection = await pool.getConnection();
  try {
    // 트랜잭션 시작
    await connection.beginTransaction();

    // DB에서 chatRoomMember 정보 가져오기
    const [result] = await connection.query(
      "SELECT * FROM chatRoomMember WHERE profileId = ?",
      [headers.memberId]
    );

    // id가 마이너스인 chatRoom 정보 가져오기
    const [existingChatroom] = await connection.query(
      "SELECT * FROM chatRoom WHERE ABS(memberId) = ABS(?) AND memberId < 0 OR ABS(opponentId) = ABS(?) AND opponentId < 0",
      [headers.memberId, headers.memberId]
    );

    if (existingChatroom.length > 0) {
      // chatRoom 사용자 id값 양수로 변경
      await connection.query(
        "UPDATE chatRoom SET memberId = CASE WHEN ABS(memberId) = ABS(?) THEN ? ELSE memberId END, opponentId = CASE WHEN ABS(opponentId) = ABS(?) THEN ? ELSE opponentId END WHERE chatRoomId = ?",
        [
          headers.memberId,
          headers.memberId,
          headers.memberId,
          headers.memberId,
          headers.chatRoomId,
        ]
      );

      // '채팅방에 들어왔습니다' 메세지 생성 및 전송
      const roomId = headers.chatRoomId;
      const messageBody = {
        senderId: headers.memberId,
        chatMessage: "채팅방에 들어왔습니다.",
        senderType: "COME",
      };

      // DB에 메시지 저장
      const [insertResult] = await connection.query(
        "INSERT INTO chatMessage (chatRoomId, senderId, chatMessage, senderType, unreadCount) VALUES (?, ?, ?, ?, ?)",
        [
          roomId,
          messageBody.senderId,
          messageBody.chatMessage,
          messageBody.senderType,
          1,
        ]
      );

      console.log("지금 들어온 메세지 아이디 >>>>>>>", insertResult.insertId);

      // limitMessageId 설정하기
      await connection.query(
        "UPDATE chatRoomMember SET profileId = ?, limitMessageId = ? WHERE ABS(profileId) = ? AND chatRoomId = ?",
        [
          headers.memberId,
          insertResult.insertId,
          headers.memberId,
          headers.chatRoomId,
        ]
      );

      // 저장된 메시지의 createdAt 값 가져오기
      const [createdAtResult] = await connection.query(
        "SELECT createdAt FROM chatMessage WHERE chatMessageId = ?",
        [insertResult.insertId]
      );

      if (createdAtResult.length > 0) {
        messageBody.createdAt = new Date(createdAtResult[0].createdAt)
          .toISOString()
          .split(".")[0];
      } else {
        // 만약 createdAt 조회 실패 시 기본 값 설정
        messageBody.createdAt = new Date().toISOString().split(".")[0];
      }

      // STOMP 메시지 전송 전에 로그 출력
      console.log(`Sending message to /topic/chat/${roomId}:`, messageBody);

      // 메시지 전송
      stompServer.send(
        `/topic/chat/${roomId}`,
        {},
        JSON.stringify(messageBody)
      );

      // 트랜잭션 커밋
      await connection.commit();
    }
  } catch (error) {
    // 에러 발생 시 트랜잭션 롤백
    await connection.rollback();
    console.error("Error while processing connected event: ", error);
  } finally {
    // 연결 해제
    connection.release();
  }
  console.log(`Client connected with session ID: ${sessionId}`);
};

module.exports = handleConnected;
