export interface Registration {
  id: number;
  user_id: number;
  event_id: number;
}

export interface CreateRegistration {
  user_id: number[];
  event_id: number;
}
