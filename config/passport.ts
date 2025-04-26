// TODO:
// - setup passport-google-oauth20
// - setup JWT

import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import passport from 'passport';
import db from './connectdb.ts';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import type IUser from '../models/User';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: 'http://localhost:3000/oauth2/redirect/google', // temporary local callback (use env variables for url)
      scope: ['profile', 'email'],
    },
    async function verify(
      _accessToken: string, // not used
      _refreshToken: string, // not used
      profile: passport.Profile,
      done: (error: Error | null, user?: IUser | false) => void
    ) {
      try {
        // user variables
        const email: string | undefined = profile.emails?.[0]?.value;
        const google_id: string | undefined = profile.id;
        if (!email || !google_id) throw new Error('Google identities missing.');

        const display_picture: string | undefined = profile.photos?.[0]?.value;
        const name: string = profile.displayName;

        // query for checking if the user has logged in with their google account before
        const [rows] = await db.query<RowDataPacket[]>(
          'SELECT * FROM users WHERE google_id = ?',
          [google_id]
        );

        let user: IUser;

        if (rows.length == 0) {
          // create a new record in the database for first time logins
          const [result] = await db.query<ResultSetHeader>(
            'INSERT INTO users (email, display_picture, name, google_id) VALUES (?, ?, ?, ?)',
            [email, display_picture, name, google_id]
          );

          user = {
            id: result.insertId,
            name,
            email,
            display_picture,
            google_id,
          };
        } else {
          user = rows[0] as IUser;
        }

        // callback with the user object (new or existing user)
        return done(null as null, user as IUser);
      } catch (error) {
        done(error as Error);
      }
    }
  )
);

passport.serializeUser(function (user: IUser, done) {
  done(null, user.id);
});

passport.deserializeUser(async function (id: number, done) {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (rows.length == 0) {
      return done(null, false);
    }

    const user = rows[0] as IUser;
    done(null, user);
  } catch (error) {
    done(error);
  }
});
