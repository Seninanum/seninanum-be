const passport = require("passport");
const kakaoStrategy = require("passport-kakao");
const jwt = require("jsonwebtoken");
const { Users } = require("../models");

module.exports = () => {
  passport.use(
    new kakaoStrategy(
      {
        clientID: process.env.KAKAO_ID,
        callbackURL: "/auth/kakao/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const exUsesr = await Users.findOne({
            where: {
              email: profile._json.kakao_account.email,
            },
          });

          if (exUser) {
            const token = jwt.sign(
              {
                userId: wxUser.userId,
              },
              process.env.JWT_SECRET
            );
            return done(null, token);
          } else {
            const newUser = await Users.create({
              email: profile._json.kakao_account.email,
              nickName: profile.displayName,
            });

            const token = jwt.sign(
              {
                userId: newUser.userId,
              },
              process.env.JWT_SECRET
            );
            console.log(token);
            return done(null, token);
          }
        } catch (error) {
          console.log(error);
          done(error);
        }
      }
    )
  );
};
