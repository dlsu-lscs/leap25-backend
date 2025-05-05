export interface Registration {
  id: number;
  user_id: number;
  event_id: number;
  registration_date: Date;
}

export interface CreateRegistration {
  user_id: number;
  event_id: number;
}
