const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.send("Hello from 되라되라 test router!");
});

module.exports = router;
