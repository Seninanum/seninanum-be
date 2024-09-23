// import
require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");

// router
const kakaoRouter = require("./routes/auth/kakaoAuth");
const signUpRouter = require("./routes/auth/signup");
const loginRouter = require("./routes/auth/login");
const refreshRouter = require("./routes/auth/refresh");
const getUserTypeRouter = require("./routes/user/userType");
const RecruitRouter = require("./routes/recruit/recruit");
const careerRouter = require("./routes/career/career");
const careerItemRouter = require("./routes/career/careerItem");

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
app.use(bodyParser.json());

app.use("/auth", kakaoRouter);
app.use("/auth", signUpRouter);
app.use("/auth", loginRouter);
app.use("/auth", refreshRouter);
app.use("/recruit", verifyToken, RecruitRouter);
app.use("/user", verifyToken, getUserTypeRouter);
app.use("/career", verifyToken, careerRouter);
app.use("/career/item", verifyToken, careerItemRouter);

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

app.listen(app.get("port"), () => {
  console.log(app.get("port"), "번 포트에서 대기중");
});
module.exports = app;
