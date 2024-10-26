// databaseHelper.js 또는 유틸리티 파일에 작성하여 재사용 가능하도록 모듈화
async function fetchPaginatedMessages(
  pool,
  tableName,
  roomId,
  profileId,
  page = 0,
  limit = 10
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

    const offset = page * limit;

    // 메시지 내역을 페이지에 맞게 가져옵니다.
    const [messages] = await pool.query(
      `SELECT * FROM ?? WHERE chatMessageId > ? AND chatRoomId = ? ORDER BY chatMessageId ASC LIMIT ? OFFSET ?`,
      [tableName, room[0]?.limitMessageId || 0, roomId, limit, offset]
    );

    return messages;
  } catch (error) {
    throw error;
  }
}

module.exports = { fetchPaginatedMessages };
