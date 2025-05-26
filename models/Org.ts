export interface Org {
  id: number;
  name: string;
  org_logo: string;
  contentful_id: string;
  org_url?: string | null;
}

export interface CreateOrg {
  name: string;
  org_logo: string;
  contentful_id: string;
  org_url?: string | undefined;
}

export interface UpdateOrg {
  name?: string;
  org_logo?: string;
  org_url?: string | null;
}
