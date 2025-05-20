export interface Bookmark {
  id: number;
  user_id: number;
  event_id: number;
}

export interface CreateBookmark {
  user_id: number;
  event_id: number;
}
