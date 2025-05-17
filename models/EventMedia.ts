export interface EventMedia {
  pub_url: string;
  event_id: number;
  contentful_id: string;
}

export interface UpdateEventMedia {
  pub_url: string;
}

export type EventMediaPayload = {
  sys: {
    id: string;
    contentType: {
      sys: {
        id: 'eventMedia';
      };
    };
  };
  fields: {
    pubOneFile?: {
      'en-US': {
        sys: {
          id: string;
          type: 'Link';
          linkType: 'Asset';
        };
      };
    };
    eventRef: {
      'en-US': {
        sys: {
          id: string;
          type: 'Link';
          linkType: 'Entry';
        };
      };
    };
  };
};
