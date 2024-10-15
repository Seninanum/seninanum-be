const StompServer = require("stomp-broker-js");
const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

module.exports = function (server) {
  // STOMP 서버 설정
  const stompServer = new StompServer({
    server: server, // Express HTTP 서버와 통합
    // debug: console.log,
    path: "/meet", // WebSocket 엔드포인트
    heartbeat: [0, 0], // 하트비트 설정
  });

  // // 클라이언트가 구독할 때
  stompServer.on("subscribe", (subscription, headers) => {
    console.log(`Client subscribed to ${subscription.topic}`);
  });

  // 클라이언트가 연결할 때
  stompServer.on("connected", (sessionId, headers) => {
    console.log("connect headers: ", headers);
    console.log(`Client connected with session ID: ${sessionId}`);
  });

  // 클라이언트가 메시지를 보낼 때
  stompServer.on("send", async (message) => {
    const destination = message.dest; // 메시지가 보내진 경로
    const messageBody = JSON.parse(message.frame.body);
    const roomId = destination.split("/").pop();

    if (destination.startsWith(`/app/chat/`)) {
      console.log("message>>>>>>", message); //확인용
      // 디코딩
      const binaryMessage = new Uint8Array(
        Object.values(messageBody.chatMessage)
      );
      const decodedMessage = new TextDecoder().decode(binaryMessage);

      try {
        let result;

        // DB에 저장
        [result] = await pool.query(
          "INSERT INTO chatMessage (chatRoomId, senderId, chatMessage, senderType, unreadCount) VALUES (?, ?, ?, ?, ?)",
          [
            roomId,
            messageBody.senderId,
            decodedMessage,
            messageBody.senderType,
            1,
          ]
        );

        // 쿼리 결과가 없는 경우에도 코드가 계속 실행되도록 수정
        if (!result || !result.insertId) {
          console.warn("DB 저장에 실패했거나, result 값이 없습니다.");
        } else {
          // 방금 저장한 행의 createdAt 값을 조회
          const [createdAtResult] = await pool.query(
            "SELECT createdAt FROM chatMessage WHERE chatMessageId = ?",
            [result.insertId]
          );

          // 메세지 시간
          const createdAt = createdAtResult[0].createdAt
            .toISOString()
            .split(".")[0]; // '2024-10-14T21:08:58'
          console.log("createdAt>>>>>>>>", createdAt, typeof createdAt);
          messageBody.createdAt = createdAt.trim();
          messageBody.chatMessageId = result.insertId;
        }

        // 확인용
        console.log("Sending message:", JSON.stringify(messageBody));

        // 메세지 전달
        stompServer.send(
          `/topic/chat/${roomId}`,
          {},
          JSON.stringify(messageBody)
        );
      } catch (error) {
        console.log(error);
      }
    }
  });

  // 클라이언트가 연결을 끊을 때
  stompServer.on("disconnected", (sessionId) => {
    console.log(`Client disconnected with session ID: ${sessionId}`);
  });

  console.log("STOMP server is running on wss://api.seninanum.shop/meet");
};
