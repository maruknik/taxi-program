// src/types/api.types.ts

// Базові типи для API responses
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status: number;
}

// Часові мітки
export interface Timestamps {
  created_at: string;
  updated_at: string;
}
