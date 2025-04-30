export interface Subtheme {
  id: number;
  title: string;
  logo_pub_url: string;
  background_pub_url: string;
}

export interface CreateSubtheme {
  title: string;
  logo_pub_url: string;
  background_pub_url: string;
}

export interface UpdateSubtheme {
  title?: string;
  logo_pub_url?: string;
  background_pub_url?: string;
}
