const express = require("express");
const router = express.Router();
const passport = require("passport");

router.get("/auth/kakao", passport.authenticate("kakao"));

router.get(
  "/auth/kakao/callback",
  passport.authenticate("kakao", {
    failureRedirect: "/",
  }),
  (req, res) => {
    const token = req.user;
    const query = "?token=" + token;
    res.locals.token = token;

    res.redirect(`http://localhost:3000/${query}`);
  }
);

router.get("/auth/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      console.error(err);
      return res.redirect("/");
    }
    res.redirect("http://localhost:3000/");
  });
});

module.exports = router;
