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
