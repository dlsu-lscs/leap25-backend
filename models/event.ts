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
}
