const express = require("express");
const router = express.Router();
const {
  renderProfile,
  renderJoin,
  renderMain,
} = require("../controllers/page");

router.use((req, res, next) => {
  res.locals.user = null;
  res.locals.followerCount = 0;
  res.locals.followingCount = 0;
  res.locals.followingIdList = [];
  next();
});

//라우터의 마지막 미들웨어 : 컨트롤러
router.get("/profile", renderProfile);
router.get("/join", renderJoin);
router.get("/", renderMain);

module.exports = router;
