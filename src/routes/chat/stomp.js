const express = require("express");
const router = express.Router();
const pool = require("../../database/db");

const StompServer = require("stomp-broker-js");

// STOMP 서버 설정
const server = new StompServer({
  port: 61613, // STOMP 서버가 청취할 포트
  wsPort: 8080, // WebSocket을 사용할 경우의 포트
  path: "/stomp", // WebSocket 경로
  heartbeat: [4000, 4000], // 클라이언트 및 서버 간의 하트비트 설정
  debug: console.log, // 디버그 로그 출력
});

// STOMP 서버 구독 시 로깅
server.on("subscribe", (subscriptionId, headers) => {
  console.log(`Client subscribed to ${headers.destination}`);
});

// STOMP 서버 연결 시 로깅
server.on("connect", (sessionId, headers) => {
  console.log(`Client connected with sessionId: ${sessionId}`);
});

// STOMP 서버로 메시지가 도착하면 처리
server.on("message", (subscriptionId, message) => {
  console.log(`Message received from subscriptionId: ${subscriptionId}`);
  console.log(`Message body: ${message.body}`);

  // 메시지를 발행한 클라이언트에 다시 전송 (에코)
  server.send(message.headers.destination, {}, message.body);
});

// STOMP 서버 연결 해제 시 로깅
server.on("disconnect", (sessionId) => {
  console.log(`Client disconnected with sessionId: ${sessionId}`);
});

// 서버가 실행되고 있다는 로그 출력
console.log(`STOMP server is running on ws://localhost:8080/stomp`);
