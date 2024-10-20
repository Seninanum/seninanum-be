// 미들웨어 정의
function validateRequestBody(req, res, next) {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: "요청 본문이 비어 있습니다." });
  }
  next(); // 다음 미들웨어 또는 라우터 핸들러로 이동
}

module.exports = {
  validateRequestBody,
};
