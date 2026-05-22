export interface LocationSummary {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
  landmark?: string;
  createdAt?: string;
}

export interface CreateLocationRequest {
  latitude: number;
  longitude: number;
  address: string;
  landmark?: string;
}
