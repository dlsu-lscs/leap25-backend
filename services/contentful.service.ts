import { deliveryClient } from 'config/contentful';

export async function getImageUrlById(id: string): Promise<string | null> {
  try {
    const asset = await deliveryClient.getAsset(id);
    const file = asset.fields.file;

    if (!file || !file.url) {
      throw new Error('Asset not found.');
    }

    return file.url.startsWith('//') ? `https:${file.url}` : file.url;
  } catch (error) {
    console.error(
      'Error fetching Contentful asset: ',
      (error as Error).message
    );
    return null;
  }
}
