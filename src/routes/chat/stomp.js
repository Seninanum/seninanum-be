const StompServer = require("stomp-broker-js");

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
  stompServer.on("send", (dest, frame) => {
    console.log(`Destination: ${JSON.stringify(dest)}`);
    console.log(`Message Frame: ${JSON.stringify(frame)}`);

    // const destination = headers.destination; // 메시지가 보내진 경로
    // const messageBody = JSON.parse(msg); // 메시지 본문 (chatMessage, senderId, receiverId 등)

    // if (destination.startsWith("/app/chat/")) {
    //   // 경로가 "/app/chat/{roomId}"로 시작하는 경우
    //   const roomId = destination.split("/")[3]; // roomId 추출

    //   // 해당 roomId에 있는 모든 클라이언트에게 메시지 브로드캐스트
    //   stompServer.send(
    //     `/topic/chat/${roomId}`,
    //     headers,
    //     JSON.stringify(messageBody)
    //   );
    // }
  });

  // 클라이언트가 연결을 끊을 때
  stompServer.on("disconnected", (sessionId) => {
    console.log(`Client disconnected with session ID: ${sessionId}`);
  });

  console.log("STOMP server is running on wss://api.seninanum.shop/meet");
};
