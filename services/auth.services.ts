import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function googleAuth2(accessToken: string): Promise<string | null> {
  if (!accessToken) return null;

  try {
    const ticket = await client.verifyIdToken({
      idToken: accessToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) throw new Error('Invalid token payload.');

    const user = {
      google_id: payload.sub,
      email: payload.email,
      name: payload.name,
      display_picture: payload.picture,
    };

    const jwt_token = jwt.sign(user, process.env.JWT_SECRET as string, {
      expiresIn: '30d',
    });

    return jwt_token;
  } catch (error) {
    console.log('Error on authentication: ' + (error as Error).message);
    return null;
  }
}
