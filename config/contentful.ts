import contentful from 'contentful-management';
import type { Environment } from 'contentful-management';
import 'dotenv/config';

const { createClient } = contentful;

export const client = createClient({
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN as string,
});
export const getContentfulEnv = async function (): Promise<Environment> {
  const space = await client.getSpace(
    process.env.CONTENTFUL_SPACE_ID as string
  );
  return await space.getEnvironment(
    process.env.CONTENTFUL_ENVIRONMENT as string
  );
};
