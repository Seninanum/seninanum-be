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
  stompServer.on("send", async (dest, frame) => {
    const destination = dest?.frame?.headers?.destination; // 메시지가 보내진 경로

    if (!destination) {
      console.error("Error: destination is undefined");
      return; // destination이 없으면 함수 종료
    }
    const messageBody = JSON.parse(dest.frame.body); // 메시지 본문
    const roomId = destination.split("/").pop();

    console.log("확인 >>>> ", destination, messageBody, roomId);

    try {
      // DB에 저장
      await pool.query(
        "INSERT INTO chatMessage (chatRoomId, senderId, chatMessage, senderType, unreadCount) VALUES (?, ?, ?, ?, ?)",
        [
          roomId,
          messageBody.senderId,
          messageBody.chatMessage,
          messageBody.publishType,
          1,
        ]
      );
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ error: "An error occurred while creating the careerProfile" });
    }

    // 메세지 전달
    if (destination.startsWith("/app/chat/")) {
      // 해당 roomId에 있는 클라이언트에게 메시지 브로드캐스트
      stompServer.send(
        `/topic/chat/${roomId}`,
        {},
        JSON.stringify(messageBody)
      );
    }
  });

  // 클라이언트가 연결을 끊을 때
  stompServer.on("disconnected", (sessionId) => {
    console.log(`Client disconnected with session ID: ${sessionId}`);
  });

  console.log("STOMP server is running on wss://api.seninanum.shop/meet");
};
