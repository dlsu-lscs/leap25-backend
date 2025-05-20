export interface Event {
  id: number;
  org_id: number;
  title: string;
  description?: string;
  subtheme_id?: number;
  venue?: string;
  schedule: Date;
  fee?: number;
  code: string;
  registered_slots: number;
  max_slots: number;
  contentful_id: string;
  slug: string;
  gforms_url: string;
  schedule_end: Date;
}

export interface CreateEvent {
  org_id: number;
  title: string;
  description?: string;
  subtheme_id?: number;
  venue?: string;
  schedule: Date;
  fee?: number;
  code: string;
  registered_slots?: number;
  max_slots: number;
  contentful_id: string;
  slug: string;
  gforms_url: string;
  schedule_end: Date;
}

export interface UpdateEvent {
  org_id?: number;
  title?: string;
  description?: string;
  subtheme_id?: number;
  venue?: string;
  schedule?: Date;
  fee?: number;
  code?: string;
  registered_slots?: number;
  max_slots?: number;
  slug?: string;
  gforms_url?: string;
  schedule_end?: Date;
}
