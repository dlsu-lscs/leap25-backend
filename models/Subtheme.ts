export interface Subtheme {
  id: number;
  title: string;
  logo_pub_url: string;
  background_pub_url: string;
  contentful_id: string;
  short_desc?: string;
}

export interface CreateSubtheme {
  title: string;
  logo_pub_url: string;
  background_pub_url: string;
  contentful_id: string;
  short_desc?: string;
}

export interface UpdateSubtheme {
  title?: string;
  logo_pub_url?: string;
  background_pub_url?: string;
  contentful_id: string;
  short_desc?: string;
}
