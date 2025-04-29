export interface User {
  id: number;
  google_id: string;
  email: string;
  display_picture?: string;
  name: string;
}

export interface CreateUser {
  email: string;
  display_picture?: string;
  name: string;
}

export interface UpdateUser {
  email?: string;
  display_picture?: string;
  name?: string;
}
