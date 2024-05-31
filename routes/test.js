const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.send("Hello from new2 test router!");
});

module.exports = router;
