import contentful from 'contentful-management';
import type { Environment } from 'contentful-management';
import { createClient as createClient2 } from 'contentful';
import 'dotenv/config';

const { createClient } = contentful;

export const client = createClient({
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN as string,
});

export const deliveryClient = createClient2({
  space: process.env.CONTENTFUL_SPACE_ID as string,
  accessToken: process.env.CONTENTFUL_DELIVERY_ACCESS_TOKEN as string,
  environment: process.env.CONTENTFUL_ENVIRONMENT,
});

export const getContentfulEnv = async function (): Promise<Environment> {
  const space = await client.getSpace(
    process.env.CONTENTFUL_SPACE_ID as string
  );
  return await space.getEnvironment(
    process.env.CONTENTFUL_ENVIRONMENT as string
  );
};
