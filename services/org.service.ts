import mysql from 'mysql2/promise';
import { getOrg } from './contentful.service';
import { getDB } from '../config/database';
import type { Org, CreateOrg, UpdateOrg } from '../models/Org';
import { getImageUrlById } from './contentful.service';

export async function createOrg(data: CreateOrg): Promise<Org> {
  const { name, org_logo, contentful_id } = data;
  const db = await getDB();

  const [result] = await db.execute<mysql.ResultSetHeader>(
    'INSERT INTO orgs (name, org_logo, contentful_id) VALUES (?, ?, ?)',
    [name, org_logo, contentful_id]
  );

  const insertId = result.insertId;

  return {
    id: insertId,
    name,
    org_logo,
    contentful_id,
  };
}

export async function createOrgPayload(payload: any): Promise<Org | null> {
  const fields = payload.fields;

  const org_logo_id = fields.org_logo?.['en-US']?.sys?.id;
  const org_logo = org_logo_id ? await getImageUrlById(org_logo_id) : null;
  const name = fields.org_name?.['en-US'];

  if (!name || !org_logo) {
    return null;
  }

  const org = {
    name,
    org_logo,
    contentful_id: payload.sys.id,
  };

  return await createOrg(org as any);
}

export async function getAllOrgs(): Promise<Org[]> {
  const db = await getDB();
  const [rows] = await db.query('SELECT * FROM orgs');
  return rows as Org[];
}

export async function getOrgById(id: number): Promise<Org[]> {
  const db = await getDB();
  const [rows] = await db.query('SELECT * FROM orgs WHERE id = ?', [id]);
  return rows as Org[];
}

export async function updateOrg(
  id: number,
  data: UpdateOrg
): Promise<Org | null> {
  const existingOrg = await getOrgById(id);
  if (!existingOrg[0]) return null;

  const { name = existingOrg[0].name, org_logo = existingOrg[0].org_logo } =
    data;
  const db = await getDB();
  await db.execute('UPDATE orgs SET name = ?, org_logo = ? WHERE id = ?', [
    name,
    org_logo,
    id,
  ]);

  const updated_org = await getOrgById(id);

  if (!updated_org[0]) {
    return null;
  }

  return updated_org[0];
}

export async function updateOrgPayload(
  payload: any
): Promise<UpdateOrg | null> {
  const fields = payload.fields;

  const org_logo_id = fields.org_logo?.['en-US']?.sys?.id;
  const org_logo = org_logo_id ? await getImageUrlById(org_logo_id) : null;
  const name = fields.org_name?.['en-US'];
  const contentful_id = payload.sys.id;

  if (!contentful_id) return null;

  const existing_org = await getOrg(contentful_id);
  if (!existing_org) return null;

  const updated_org: UpdateOrg = {
    name: name || existing_org.name,
    org_logo: org_logo || existing_org.org_logo,
  };

  const orgs = await getOrgByContentfulId(contentful_id);

  if (!orgs[0]) {
    return null;
  }

  const updated_org_id = orgs[0].id;

  return await updateOrg(updated_org_id, updated_org);
}

export async function deleteOrg(id: number): Promise<void> {
  const db = await getDB();
  await db.execute('DELETE FROM orgs WHERE id = ?', [id]);
}

export async function handleContentfulWebhook(payload: any): Promise<{
  org: Org | UpdateOrg | null;
  is_created: boolean;
}> {
  const contentful_id = payload.sys.id;

  const orgs = await getOrgByContentfulId(contentful_id);

  const is_exists: boolean = orgs.length > 0;

  const org = is_exists
    ? await updateOrgPayload(payload)
    : await createOrgPayload(payload);

  return { org, is_created: !is_exists };
}

export async function getOrgByContentfulId(
  contentful_id: string
): Promise<Org[]> {
  const db = await getDB();
  const [orgs] = await db.query('SELECT * FROM orgs WHERE contentful_id = ?', [
    contentful_id,
  ]);
  return orgs as Org[];
}

export async function deleteOrgContentful(payload: any): Promise<Org[] | null> {
  const contentful_id = payload.sys.id;

  const org = await getOrgByContentfulId(contentful_id);

  if (!org[0]) {
    throw new Error('Org not found in database using contentful id.');
  }

  await deleteOrg(org[0].id);

  const deleted_org = await getOrgById(org[0].id);

  return deleted_org;
}
