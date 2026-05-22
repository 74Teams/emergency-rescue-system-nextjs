export type ApiRole = "Admin" | "Citizen" | "Dispatcher" | "Commander" | "Rescuer" | "RescuerLeader";

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errors?: Array<{ field?: string; message: string }>;
  error?: string;
}

export interface PaginationMeta {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export type PaginatedResponse<T> = ApiResponse<{ items: T[] } & PaginationMeta>;

export interface PaginationQuery {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
}

export interface Address {
  street?: string;
  city?: string;
  district?: string;
  gps?: string;
}
