import mysql from 'mysql2/promise';
import { getDB } from '../config/database';
import type { Org, CreateOrg, UpdateOrg } from '../models/Org';

export async function createOrg(data: CreateOrg): Promise<Org> {
  const db = await getDB();
  const { name, org_logo } = data;

  const [result] = await db.execute<mysql.ResultSetHeader>(
    'INSERT INTO orgs (name, org_logo) VALUES (?, ?)',
    [name, org_logo]
  );

  const insertId = result.insertId;

  return {
    id: insertId,
    name,
    org_logo,
  };
}

export async function getAllOrgs(): Promise<Org[]> {
  const db = await getDB();
  const [rows] = await db.query('SELECT * FROM orgs');
  return rows as Org[];
}

export async function getOrgById(id: number): Promise<Org | null> {
  const db = await getDB();
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
  const db = await getDB();
  await db.execute('UPDATE orgs SET name = ?, org_logo = ? WHERE id = ?', [
    name,
    org_logo,
    id,
  ]);

  return getOrgById(id);
}

export async function deleteOrg(id: number): Promise<void> {
  const db = await getDB();
  await db.execute('DELETE FROM orgs WHERE id = ?', [id]);
}
