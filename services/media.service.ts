import { getContentfulEnv } from '../config/contentful';
import type {
  Collection,
  Entry,
  EntryProps,
  KeyValueMap,
} from 'contentful-management';

export async function getEventMedia(): Promise<
  Collection<Entry, EntryProps<KeyValueMap>>
> {
  const env = await getContentfulEnv();

  const media = await env.getEntries({
    content_type: 'eventMedia',
  });

  console.log('meddiaa: ' + media);

  return media as Collection<Entry, EntryProps<KeyValueMap>>;
}
