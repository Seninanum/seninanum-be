const express = require("express");
const router = express.Router();

router.get("/userType", async (req, res) => {
  /**
    #swagger.tags = ['User']
    #swagger.summary = '유저 타입 불러오기'
   */
  const user = req.user;
  res.json(user.userType);
});

module.exports = router;
