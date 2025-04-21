// TODO:
// - setup passport-google-oauth20
// - setup JWT
/*
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { createRequire } from 'node:module';
import type { Profile } from 'passport';
import db from './connectdb.ts';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import type IUser from '../models/User';

const require = createRequire(import.meta.url);
const passport = require('passport');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: 'http://localhost:3000/auth/google/callback', // temporary local callback
      scope: ['profile', 'email'],
    },
    async function verify(
      _accessToken: string,
      _refreshToken: string,
      profile: Profile,
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
);*/
