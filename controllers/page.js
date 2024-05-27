exports.renderProfile = (req, res, next) => {
  res.render("profile", { title: "내 정보 - NodeBird" });
};
exports.renderJoin = (req, res, next) => {
  res.render("join", { title: "회원 가입 - NodeBird" });
};
exports.renderMain = (req, res, next) => {
  const twits = [];
  res.render("main", { title: "NodeBird", twits });
};

// 라우터 -> 컨트롤러 -> 서비스 호출
// 컨트롤러는 요청과 응답을 앎, 서비스는 요청과 응답을 모름.
