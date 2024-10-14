const StompServer = require("stomp-broker-js");

module.exports = function (server) {
  // STOMP 서버 설정
  const stompServer = new StompServer({
    server: server, // Express HTTP 서버와 통합
    path: "/meet", // WebSocket 엔드포인트
    heartbeat: [4000, 4000], // 하트비트 설정
  });

  // 클라이언트가 구독할 때
  stompServer.on("subscribe", (subscription, headers) => {
    console.log(`Client subscribed to ${headers.destination}`);
  });

  // 클라이언트가 연결할 때
  stompServer.on("connect", (sessionId, headers) => {
    console.log(`Client connected with session ID: ${sessionId}`);
  });

  // 클라이언트가 메시지를 보낼 때
  stompServer.on("message", (msg, headers) => {
    console.log(`Received message: ${msg}`);

    // 메시지를 전송한 클라이언트 외에 모든 구독자에게 메시지를 브로드캐스트
    stompServer.send(headers.destination, headers, msg);
  });

  // 클라이언트가 연결을 끊을 때
  stompServer.on("disconnect", (sessionId) => {
    console.log(`Client disconnected with session ID: ${sessionId}`);
  });

  console.log("STOMP server is running on wss://api.seninanum.shop/meet");
};
