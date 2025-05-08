import mysql from 'mysql2/promise';
import db from '../config/connectdb';
import { getOrg } from './contentful.service';
import type { Org, CreateOrg, UpdateOrg } from '../models/Org';
import { getImageUrlById } from './contentful.service';

export async function createOrg(data: CreateOrg): Promise<Org> {
  const { name, org_logo, contentful_id } = data;

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
  const [rows] = await db.query('SELECT * FROM orgs');
  return rows as Org[];
}

export async function getOrgById(id: number): Promise<Org | null> {
  const [rows] = await db.query('SELECT * FROM orgs WHERE id = ?', [id]);
  const orgs = rows as Org[];
  return orgs[0] || null;
}

export async function updateOrg(
  id: number,
  data: UpdateOrg
): Promise<Org | null> {
  const existingOrg = await getOrgById(id);
  if (!existingOrg) return null;

  const { name = existingOrg.name, org_logo = existingOrg.org_logo } = data;

  await db.execute('UPDATE orgs SET name = ?, org_logo = ? WHERE id = ?', [
    name,
    org_logo,
    id,
  ]);

  return getOrgById(id);
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

  const [orgs] = (await db.execute(
    'SELECT id FROM orgs WHERE contentful_id = ?',
    [contentful_id]
  )) as any[];

  if (orgs.length === 0) {
    return null;
  }

  const updated_org_id = orgs[0].id;

  return await updateOrg(updated_org_id, updated_org);
}

export async function deleteOrg(id: number): Promise<void> {
  await db.execute('DELETE FROM orgs WHERE id = ?', [id]);
}

export async function handleContentfulWebhook(payload: any): Promise<{
  org: Org | UpdateOrg | null;
  is_created: boolean;
}> {
  const contentful_id = payload.sys.id;

  const [orgs] = (await db.execute(
    'SELECT contentful_id FROM orgs WHERE contentful_id = ?',
    [contentful_id]
  )) as any[];

  const is_exists: boolean = orgs.length > 0;

  const org = is_exists
    ? await updateOrgPayload(payload)
    : await createOrgPayload(payload);

  return { org, is_created: !is_exists };
}
