import jwt from 'jsonwebtoken';
import axios from 'axios';
import type { User } from '../models/User';

export async function googleAuth2(
  accessToken: string
): Promise<{ jwt_token: string; user: User } | null> {
  if (!accessToken) return null;

  try {
    const response = await axios.get(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const { data: payload } = response;

    const user = {
      google_id: payload.sub,
      email: payload.email,
      name: payload.name,
      display_picture: payload.picture,
    };

    const jwt_token = jwt.sign(user, process.env.JWT_SECRET as string, {
      expiresIn: '30d',
    });

    return { user, jwt_token };
  } catch (error) {
    console.log('Error on authentication: ' + (error as Error).message);
    return null;
  }
}
