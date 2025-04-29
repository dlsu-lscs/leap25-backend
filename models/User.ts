import type { RowDataPacket } from 'mysql2';

export interface User {
  id: number;
  google_id?: string;
  email?: string;
  display_picture?: string;
  name?: string;
}

export interface CreateUser {
  google_id?: string;
  email?: string;
  display_picture?: string;
  name?: string;
}

// For updating users (all fields optional)
export interface UpdateUser {
  google_id?: string;
  email?: string;
  display_picture?: string;
  name?: string;
}

export interface IUser extends User, RowDataPacket {}
