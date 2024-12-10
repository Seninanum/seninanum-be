const StompServer = require("stomp-broker-js");

const {
  handleConnected,
  handleSendMessage,
  handleSendLeave,
  handleDisconnected,
} = require("./stompApi");

module.exports = function (server) {
  // STOMP 서버 설정
  const stompServer = new StompServer({
    server: server, // Express HTTP 서버와 통합
    debug: console.log,
    path: "/meet", // WebSocket 엔드포인트
    heartbeat: [0, 0], // 하트비트 설정
  });

  /* 
  클라이언트 구독
  */
  stompServer.on("subscribe", (subscription, headers) => {
    console.log(`Client subscribed to ${subscription.topic}`);
  });

  /* 
  클라이언트 연결
  */
  stompServer.on("connected", async (sessionId, headers) => {
    await handleConnected(stompServer, sessionId, headers);
    console.log(`Client connected with session ID: ${sessionId}`);
  });

  /* 
    클라이언트 메세지 전송
  */
  stompServer.on("send", async (message) => {
    const destination = message.dest; // 메시지가 보내진 경로
    const messageBody = JSON.parse(message.frame.body);
    const roomId = destination.split("/").pop();

    // 사용자의 메세지 수신
    if (destination.startsWith(`/app/chat/`)) {
      console.log("message>>>>>>", messageBody.chatMessage); //확인용

      switch (messageBody.senderType) {
        case "USER":
        case "IMAGE":
        case "SCHEDULE":
        case "PAY_REQUEST":
        case "PAY_RESPONSE":
          await handleSendMessage(stompServer, messageBody, roomId);
          break;

        case "LEAVE":
          await handleSendLeave(stompServer, messageBody, roomId);
          break;
      }
    }
  });

  /* 
    클라이언트 연결 끊기
  */
  stompServer.on("disconnected", async (sessionId) => {
    await handleDisconnected(sessionId);
    console.log(`채팅방 나감: ${sessionId}`);
  });

  console.log("STOMP server is running on wss://api.seninanum.shop/meet");
};
