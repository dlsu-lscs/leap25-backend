export interface EventMedia {
  pub_one_file?: string;
  pub_url?: string;
  pub_multiple_file?: string[];
  pub_type: string;
  event_id: string;
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
