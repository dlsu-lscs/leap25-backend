export interface Org {
  id: number;
  name: string;
  org_logo: string;
  contentful_id: string;
}

export interface CreateOrg {
  name: string;
  org_logo: string;
  contentful_id: string;
}

export interface UpdateOrg {
  name?: string;
  org_logo?: string;
}
