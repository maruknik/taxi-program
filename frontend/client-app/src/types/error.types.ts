// src/types/error.types.ts
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  type: ErrorType;
  message: string;
  statusCode?: number;
  details?: Record<string, any>;
  originalError?: any;
}

export class NetworkError extends Error {
  type = ErrorType.NETWORK;
  
  constructor(message: string = 'Немає підключення до інтернету') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthError extends Error {
  type = ErrorType.AUTH;
  statusCode: number;
  
  constructor(message: string = 'Помилка аутентифікації', statusCode: number = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

export class ValidationError extends Error {
  type = ErrorType.VALIDATION;
  errors: Record<string, string[]>;
  
  constructor(message: string = 'Помилка валідації', errors: Record<string, string[]> = {}) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export class ServerError extends Error {
  type = ErrorType.SERVER;
  statusCode: number;
  
  constructor(message: string = 'Помилка сервера', statusCode: number = 500) {
    super(message);
    this.name = 'ServerError';
    this.statusCode = statusCode;
  }
}
