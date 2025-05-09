export interface EventMedia {
  pub_url: string;
  pub_type: string;
  event_id: number;
  contentful_id: string;
}

export interface UpdateEventMedia {
  pub_url: string;
  pub_type: string;
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
    pubMultipleFiles?: {
      'en-US': {
        sys: {
          id: string;
          type: 'Link';
          linkType: 'Asset';
        };
      }[];
    };
    pubType: {
      'en-US': string;
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
