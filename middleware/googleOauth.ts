// TODO:
// - setup passport-google-oauth20
// - setup JWT
/*
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import passport from 'passport';

passport.use(
  new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback", // temporary local callback
    scope: ["profile"],
    state: true
  },
  function verify(accessToken, refreshToken, profile, cb) {

  }
                    )
);*/
