export interface Highlight {
  id: number;
  event_id: number;
  title_card?: string;
  title_fallback: string;
  bg_img?: string;
  short_desc: string;
  color: string;
  contentful_id: string;
}

export interface CreateHighlight {
  event_id: number;
  title_card?: string;
  title_fallback: string;
  bg_img?: string;
  short_desc: string;
  color: string;
  contentful_id: string;
}

export interface UpdateHighlight {
  event_id?: number;
  title_card?: string;
  title_fallback?: string;
  bg_img?: string;
  short_desc?: string;
  color?: string;
}
