const StompServer = require("stomp-broker-js");
const pool = require("../../database/db");

module.exports = function (server) {
  // STOMP 서버 설정
  const stompServer = new StompServer({
    server: server, // Express HTTP 서버와 통합
    // debug: console.log,
    path: "/meet", // WebSocket 엔드포인트
    heartbeat: [0, 0], // 하트비트 설정
  });

  // 클라이언트가 구독할 때
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

    // 사용자의 메세지 수신
    if (destination.startsWith(`/app/chat/`)) {
      console.log("message>>>>>>", message); //확인용
      console.log("메세지 타입 확인 >>>>>", messageBody.senderType);

      switch (messageBody.senderType) {
        case "USER":
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

              // 메세지 시간 (KST) - 배포용
              const createdAt = new Date(createdAtResult[0].createdAt);
              messageBody.createdAt = createdAt.toISOString().split(".")[0];

              // 메세지 시간 (UTC -> KST 변환) - 로컬용
              // const createdAt = new Date(createdAtResult[0].createdAt);
              // const kstDate = new Date(createdAt.getTime() + 9 * 60 * 60 * 1000);
              // const formattedDate = kstDate.toISOString().split(".")[0];
              // messageBody.createdAt = formattedDate;

              // 응답값 수정
              messageBody.chatMessageId = result.insertId;
              messageBody.unreadCount = 1;
              messageBody.chatRoomId = roomId;
              delete messageBody.receiverId;
            }

            // 메세지 전달
            stompServer.send(
              `/topic/chat/${roomId}`,
              {},
              JSON.stringify(messageBody)
            );
          } catch (error) {
            console.log(error);
          }
          break;

        case "LEAVE":
          try {
            // 메세지를 보낸 사용자가 member인지 opponent인지 확인
            const [existingRecord] = await pool.query(
              "SELECT * FROM chatRoom WHERE memberId = ? OR opponentId = ?",
              [messageBody.senderId, messageBody.senderId]
            );
            if (existingRecord.length > 0) {
              // 나간 사람의 id 값을 -1로 업데이트
              await pool.query(
                `UPDATE chatRoom 
                  SET 
                    memberId = CASE WHEN memberId = ? THEN ? ELSE memberId END, 
                    opponentId = CASE WHEN opponentId = ? THEN ? ELSE opponentId END
                  WHERE (memberId = ? OR opponentId = ?) AND chatRoomId = ?`,
                [
                  messageBody.senderId,
                  -messageBody.senderId,
                  messageBody.senderId,
                  -messageBody.senderId,
                  messageBody.senderId,
                  messageBody.senderId,
                  roomId,
                ]
              );

              // 위에서 업데이트한 행의 roomStatus를 'inactive'로 설정
              await pool.query(
                `UPDATE chatRoom 
                  SET roomStatus = 'INACTIVE' 
                  WHERE chatRoomId = ?`,
                [roomId]
              );

              // chatRoomMember에서 해당 roomId 행 지우기
            }
          } catch (error) {
            console.log(error);
          }
          break;
      }
    }
  });

  // 클라이언트가 연결을 끊을 때
  stompServer.on("disconnected", (sessionId) => {
    console.log(`채팅방 나감: ${sessionId}`);
  });

  console.log("STOMP server is running on wss://api.seninanum.shop/meet");
};
