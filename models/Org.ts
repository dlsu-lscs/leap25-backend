export interface Org {
  id: number;
  name: string;
  org_logo?: string | null;
  contentful_id: string;
  org_url?: string | null;
}

export interface CreateOrg {
  name: string;
  org_logo?: string | null;
  contentful_id: string;
  org_url?: string | undefined;
}

export interface UpdateOrg {
  name?: string;
  org_logo?: string | null;
  org_url?: string | null;
}
