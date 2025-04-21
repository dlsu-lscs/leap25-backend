import type { RowDataPacket } from 'mysql2';

export interface User {
  id: number;
  email?: string;
  display_picture?: string;
  name?: string;
}

export interface IUser extends User, RowDataPacket {}
