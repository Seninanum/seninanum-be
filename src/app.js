// import
require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const path = require("path");
const cors = require("cors");
const http = require("http"); // http 모듈을 임포트

// router
const kakaoRouter = require("./routes/auth/kakaoAuth");
const signUpRouter = require("./routes/auth/signup");
const loginRouter = require("./routes/auth/login");
const refreshRouter = require("./routes/auth/refresh");
const userTypeRouter = require("./routes/user/userType");
const userProfileRouter = require("./routes/user/basicProfile");
const recruitRouter = require("./routes/recruit/recruit");
const careerRouter = require("./routes/career/career");
const careerCertificateRouter = require("./routes/career/careerCertificate");
const careerItemRouter = require("./routes/career/careerItem");
const chatRoomRouter = require("./routes/chat/chatRoom");
const chatRouter = require("./routes/chat/chat");
const profileRouter = require("./routes/profile/basicProfile");
const applicationRouter = require("./routes/application/application");
const matchRouter = require("./routes/match/match");
const freeBoardRouter = require("./routes/board/freeBoard");
const adviceBoardRouter = require("./routes/board/adviceBoard");

// swagger
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger/swagger-output.json");

//middleware
const { verifyToken } = require("./middlewares/jwt");

// use
const app = express();
app.set("port", process.env.PORT || 3001);

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://api.seninanum.shop",
      "https://seninanum.shop",
    ],
    credentials: true,
  })
);

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
// app.use(bodyParser.json());

app.use("/auth", kakaoRouter);
app.use("/auth", signUpRouter);
app.use("/auth", loginRouter);
app.use("/auth", refreshRouter);
app.use("/recruit", verifyToken, recruitRouter);
app.use("/user", verifyToken, userTypeRouter);
app.use("/user", verifyToken, userProfileRouter);
app.use("/profile", verifyToken, profileRouter);
app.use("/career", verifyToken, careerRouter);
app.use("/career/certificate", verifyToken, careerCertificateRouter);
app.use("/career/item", verifyToken, careerItemRouter);
app.use("/chatroom", verifyToken, chatRoomRouter);
app.use("/chat", verifyToken, chatRouter);
app.use("/application", verifyToken, applicationRouter);
app.use("/match", verifyToken, matchRouter);
app.use("/board/advice", verifyToken, adviceBoardRouter);
app.use("/board/free", verifyToken, freeBoardRouter);

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerFile, { explorer: true })
);

app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  next(error);
});
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== "production" ? err : {};
  res.status(err.status || 500);
  res.json("error");
});

// 서버 실행 (서버 객체 생성)
const server = http.createServer(app);

// STOMP 서버 통합 (stomp.js에서 생성한 stompServer 사용)
require("./routes/chat/stomp")(server);

// 서버 리스닝 시작
server.listen(app.get("port"), () => {
  console.log(app.get("port"), "번 포트에서 서버가 실행 중입니다.");
});
