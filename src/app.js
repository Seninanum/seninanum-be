// import
const express = require("express");
const morgan = require("morgan");
// const { sequelize } = require("./models");
// const kakao = require("../src/passport/kakaoStrategy");
// const passport = require("passport");
const path = require("path");
const cookieParser = require("cookie-parser");
// const session = require("express-session");
const cors = require("cors");

// router
const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const testRouter = require("./routes/test");

const app = express();
app.set("port", process.env.PORT || 3001);

// sequelize
//   .sync({ force: true })
//   .then(() => {
//     console.log("데이터베이스 연결 성공");
//   })
//   .catch((err) => {
//     console.error(err);
//   });

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
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(express.static(path.join(__dirname, "public")));

// app.use(
//   session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//       domain: " ",
//       path: "/",
//       secure: false,
//       httpOnly: false,
//     },
//   })
// );

// app.use(passport.initialize());
// app.use(passport.session());

// passport.serializeUser((token, done) => {
//   done(null, token);
// });

// passport.deserializeUser((token, done) => {
//   const decoded = jwt.verify(token, process.env.JWT_SECRET);
//   const userId = decoded.userId;

//   Users.findByPk(userId)
//     .then((user) => {
//       done(null, user);
//     })
//     .catch((err) => {
//       done(err);
//     });
// });
// kakao();

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/test", testRouter);

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

app.listen(app.get("port"), () => {
  console.log(app.get("port"), "번 포트에서 대기중");
});

module.exports = app;
