export interface EventMedia {
  pub_one_file?: string;
  pub_multiple_file?: string[];
  pub_type: 'TEXTLESS_VERTICAL' | 'TEXTLESS_HORIZONTAL' | 'MAIN';
  event_ref: any;
}
