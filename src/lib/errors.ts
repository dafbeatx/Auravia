/**
 * Pola penanganan error terstruktur dasar Aurovia.
 * Membedakan domain error tanpa framework berlebihan.
 */

export type AppErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'DATABASE_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export class AppError extends Error {
  public readonly code: AppErrorCode;
  public readonly originalError?: unknown;

  constructor(message: string, code: AppErrorCode = 'UNKNOWN_ERROR', originalError?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.originalError = originalError;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, originalError?: unknown) {
    super(message, 'VALIDATION_ERROR', originalError);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Autentikasi gagal atau sesi telah berakhir.', originalError?: unknown) {
    super(message, 'AUTHENTICATION_ERROR', originalError);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Anda tidak memiliki hak akses ke data ini.', originalError?: unknown) {
    super(message, 'AUTHORIZATION_ERROR', originalError);
    this.name = 'AuthorizationError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Terjadi kesalahan saat memproses data di server.', originalError?: unknown) {
    super(message, 'DATABASE_ERROR', originalError);
    this.name = 'DatabaseError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Gagal terhubung ke jaringan. Periksa koneksi internet Anda.', originalError?: unknown) {
    super(message, 'NETWORK_ERROR', originalError);
    this.name = 'NetworkError';
  }
}
