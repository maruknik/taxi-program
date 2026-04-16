import { AxiosError } from 'axios';
import { 
  AppError, 
  ErrorType, 
  NetworkError, 
  AuthError, 
  ValidationError, 
  ServerError 
} from '@/src/types/error.types';

export function parseApiError(error: any): AppError {
  // Axios error
  if (error.isAxiosError || error.response) {
    const axiosError = error as AxiosError;
    
    // No response - network error
    if (!axiosError.response) {
      return {
        type: ErrorType.NETWORK,
        message: 'Немає підключення до інтернету',
        originalError: error,
      };
    }

    const status = axiosError.response.status;
    const data = axiosError.response.data as any;

    // 401 Unauthorized
    if (status === 401) {
      return {
        type: ErrorType.AUTH,
        message: data?.message || 'Необхідна авторизація',
        statusCode: status,
        originalError: error,
      };
    }

    // 403 Forbidden
    if (status === 403) {
      return {
        type: ErrorType.AUTH,
        message: data?.message || 'Доступ заборонено',
        statusCode: status,
        originalError: error,
      };
    }

    // 400 Bad Request / Validation
    if (status === 400) {
      return {
        type: ErrorType.VALIDATION,
        message: data?.message || 'Невірні дані',
        statusCode: status,
        details: data?.errors || {},
        originalError: error,
      };
    }

    // 404 Not Found
    if (status === 404) {
      return {
        type: ErrorType.SERVER,
        message: data?.message || 'Ресурс не знайдено',
        statusCode: status,
        originalError: error,
      };
    }

    // 500+ Server Error
    if (status >= 500) {
      return {
        type: ErrorType.SERVER,
        message: data?.message || 'Помилка сервера',
        statusCode: status,
        originalError: error,
      };
    }

    // Other errors
    return {
      type: ErrorType.UNKNOWN,
      message: data?.message || 'Щось пішло не так',
      statusCode: status,
      originalError: error,
    };
  }

  // Network error (no axios)
  if (error instanceof NetworkError) {
    return {
      type: ErrorType.NETWORK,
      message: error.message,
      originalError: error,
    };
  }

  // Auth error
  if (error instanceof AuthError) {
    return {
      type: ErrorType.AUTH,
      message: error.message,
      statusCode: error.statusCode,
      originalError: error,
    };
  }

  // Validation error
  if (error instanceof ValidationError) {
    return {
      type: ErrorType.VALIDATION,
      message: error.message,
      details: error.errors,
      originalError: error,
    };
  }

  // Server error
  if (error instanceof ServerError) {
    return {
      type: ErrorType.SERVER,
      message: error.message,
      statusCode: error.statusCode,
      originalError: error,
    };
  }

  // Unknown error
  return {
    type: ErrorType.UNKNOWN,
    message: error?.message || 'Невідома помилка',
    originalError: error,
  };
}

export function getErrorMessage(error: any): string {
  const appError = parseApiError(error);
  return appError.message;
}

export function isNetworkError(error: any): boolean {
  const appError = parseApiError(error);
  return appError.type === ErrorType.NETWORK;
}

export function isAuthError(error: any): boolean {
  const appError = parseApiError(error);
  return appError.type === ErrorType.AUTH;
}

export function isValidationError(error: any): boolean {
  const appError = parseApiError(error);
  return appError.type === ErrorType.VALIDATION;
}
