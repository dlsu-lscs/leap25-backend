import { getContentfulEnv } from '../config/contentful';
import type { CreateOrg } from '../models/Org';

export async function getImageUrlById(id: string): Promise<string | null> {
  const client = await getContentfulEnv();
  try {
    const asset = await client.getAsset(id);
    const file = asset.fields.file?.['en-US'];
    if (!file || !file.url) {
      throw new Error('Asset not found.');
    }

    return file.url;
  } catch (error) {
    console.error(
      'Error fetching Contentful asset: ',
      (error as Error).message
    );
    return null;
  }
}

export async function getOrg(id: string): Promise<CreateOrg | null> {
  const client = await getContentfulEnv();
  try {
    const org = await client.getEntry(id);
    const name = org.fields.org_name['en-US'];
    const org_logo = org.fields.org_logo['en-US'];
    const contentful_id = org.sys.id;

    if (!org) {
      throw new Error('Organization not found.');
    }

    const fetched_org = {
      name,
      org_logo,
      contentful_id,
    };

    return fetched_org;
  } catch (error) {
    console.error(
      'Error fetching Contentful asset: ',
      (error as Error).message
    );
    return null;
  }
}
