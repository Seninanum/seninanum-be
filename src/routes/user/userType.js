const express = require("express");
const router = express.Router();

router.get("/userType", async (req, res) => {
  const user = req.user;
  res.json(user.userType);
});

module.exports = router;