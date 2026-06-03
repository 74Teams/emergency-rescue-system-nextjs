export interface ContactSummary {
  id: string;
  name: string;
  phoneNumber: string;
  relationship: string;
  email?: string | null;
  createdAt?: string;
}

export interface CreateContactInput {
  name: string;
  phoneNumber: string;
  relationship: string;
  email?: string;
}
