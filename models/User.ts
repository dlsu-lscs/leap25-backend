import type { RowDataPacket } from 'mysql2';

export default interface User {
  id?: number;
  google_id: string;
  email?: string;
  display_picture?: string;
  name?: string;
}

export interface IUser extends User, RowDataPacket {}
