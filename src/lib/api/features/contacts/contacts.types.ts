export interface ContactSummary {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  createdAt?: string;
}

export interface CreateContactInput {
  name: string;
  phone: string;
  relationship: string;
}
