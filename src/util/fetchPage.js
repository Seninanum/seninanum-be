// databaseHelper.js 또는 유틸리티 파일에 작성하여 재사용 가능하도록 모듈화
async function fetchPaginatedMessages(
  pool,
  tableName,
  roomId,
  profileId,
  page = 0
) {
  try {
    // 채팅방 멤버의 limitMessageId를 가져옵니다.
    const [room] = await pool.query(
      `SELECT limitMessageId FROM chatRoomMember WHERE chatRoomId = ? AND profileId = ?`,
      [roomId, profileId]
    );

    if (room.length === 0) {
      throw new Error("잘못된 채팅방 id 입니다.");
    }

    // 메시지 총 개수를 가져옵니다.
    const [[{ totalMessages }]] = await pool.query(
      `SELECT COUNT(*) AS totalMessages FROM ?? WHERE chatMessageId > ? AND chatRoomId = ?`,
      [tableName, room[0]?.limitMessageId || 0, roomId]
    );

    // 페이지 구성 계산
    const lastPageSize = totalMessages % 10 || 10;

    // LIMIT과 OFFSET 설정
    let limit;
    let offset;

    if (page === "0") {
      // 첫 페이지는 나머지 메시지 수만 가져옵니다.
      limit = lastPageSize;
      offset = 0;
    } else {
      // 이후 페이지는 10개씩 가져옵니다.
      limit = 10;
      offset = lastPageSize + (page - 1) * 10;
    }

    // 메시지를 가져옵니다.
    const [messages] = await pool.query(
      `SELECT * FROM ?? WHERE chatMessageId > ? AND chatRoomId = ? ORDER BY chatMessageId ASC LIMIT ? OFFSET ?`,
      [tableName, room[0]?.limitMessageId || 0, roomId, limit, offset]
    );
    return messages.reverse();
  } catch (error) {
    throw error;
  }
}

module.exports = { fetchPaginatedMessages };
