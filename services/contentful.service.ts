import { getContentfulEnv } from 'config/contentful';

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

export async function getOrgId(id: string): Promise<string | null> {
  const client = await getContentfulEnv();
  try {
    const org = await client.getEntry(id);
    const org_id = org.fields.name?.['en-US'];

    if (!org_id) {
      throw new Error('Organization not found.');
    }

    return org_id;
  } catch (error) {
    console.error(
      'Error fetching Contentful asset: ',
      (error as Error).message
    );
    return null;
  }
}

export async function getSubthemeId(id: string): Promise<string | null> {
  const client = await getContentfulEnv();
  try {
    const subtheme = await client.getEntry(id);
    const subtheme_id = subtheme.fields.id?.['en-US'];

    if (!subtheme_id) {
      throw new Error('Organization not found.');
    }

    return subtheme_id;
  } catch (error) {
    console.error(
      'Error fetching Contentful asset: ',
      (error as Error).message
    );
    return null;
  }
}
