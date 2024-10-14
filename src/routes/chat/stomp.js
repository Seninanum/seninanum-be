const StompServer = require("stomp-broker-js");

module.exports = function (server) {
  // STOMP 서버 설정
  const stompServer = new StompServer({
    server: server, // Express HTTP 서버와 통합
    debug: console.log,
    path: "/meet", // WebSocket 엔드포인트
    heartbeat: [0, 0], // 하트비트 설정
  });

  // // 클라이언트가 구독할 때
  // stompServer.on("subscribe", (subscription, headers) => {
  //   console.log(`Client subscribed to ${headers}`);
  // });
  stompServer.on("subscribe", (subscription, headers) => {
    try {
      if (headers && headers.destination) {
        console.log(`Client subscribed to ${headers.destination}`);
      } else {
        throw new Error("Destination is undefined");
      }
    } catch (error) {
      console.error("Error processing subscription:", error.message);
    }
  });

  // 클라이언트가 연결할 때
  stompServer.on("connect", (sessionId, headers) => {
    console.log(`Client connected with session ID: ${sessionId}`);
  });

  stompServer.subscribe("/**", function (msg, headers) {
    var topic = headers.destination;
    console.log(topic, "->", msg);
  });

  // // 클라이언트가 메시지를 보낼 때
  // stompServer.on("message", (msg, headers) => {
  //   console.log("headers 데이터 >>>>>>>>>>>>", headers);
  //   console.log(`Received message on ${headers.destination}: ${msg}`);

  //   const destination = headers.destination; // 메시지가 보내진 경로
  //   const messageBody = JSON.parse(msg); // 메시지 본문 (chatMessage, senderId, receiverId 등)

  //   if (destination.startsWith("/app/chat/")) {
  //     // 경로가 "/app/chat/{roomId}"로 시작하는 경우
  //     const roomId = destination.split("/")[3]; // roomId 추출

  //     // 해당 roomId에 있는 모든 클라이언트에게 메시지 브로드캐스트
  //     stompServer.send(
  //       `/topic/chat/${roomId}`,
  //       headers,
  //       JSON.stringify(messageBody)
  //     );
  //   }
  // });
  stompServer.on("message", (msg, headers) => {
    console.log("Headers received:", headers); // headers 전체를 로그로 출력
    console.log(`Received message on ${headers}: ${msg}`);
  });

  // 클라이언트가 연결을 끊을 때
  stompServer.on("disconnect", (sessionId) => {
    console.log(`Client disconnected with session ID: ${sessionId}`);
  });

  console.log("STOMP server is running on wss://api.seninanum.shop/meet");
};
