// TODO:
// - setup passport-google-oauth20
// - setup JWT
/*
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import passport from 'passport';
import db from '../config/connectdb.ts';
import type IUser from '../models/User';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: 'http://localhost:3000/auth/google/callback', // temporary local callback
      scope: ['profile', 'email'],
    },
    async function verify(
      accessToken: string,
      refreshToken: string,
      profile: passport.Profile,
      cb: (error: Error | null, user?: IUser) => void
    ) {
      try {
        // User table variables
        const email: string | undefined = profile.emails?.[0]?.value;
        const google_id: string | undefined = profile.id;
        if (!email || !google_id) throw new Error('Google identities missing.');

        const display_picture: string | undefined = profile.photos?.[0]?.value;
        const name: string = profile.displayName;

        const [identity] = await db.query<IUser[]>(
          'SELECT * FROM users WHERE google_id = ?',
          [google_id]
        );

        if (!identity) {
          const [result] = await db.query(
            'INSERT INTO users (email, display_picture, name, google_id) VALUES (?, ?, ?, ?)',
            [email, display_picture, name, google_id]
          );

          const user: IUser = {
            id: result.id,
            name,
            email,
            display_picture,
            google_id,
          };

          cb(null, user);
        }
      } catch (err) {
        cb(err as Error);
      }
    }
  )
);*/
