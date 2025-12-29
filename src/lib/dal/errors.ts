/**
 * Custom error classes for the Data Access Layer
 * Provides typed errors for different failure scenarios
 */

export class DALError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DALError";
  }
}

export class UnauthorizedError extends DALError {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends DALError {
  constructor(message = "Access denied") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends DALError {
  constructor(resource: string, id?: string) {
    super(id ? `${resource} with id '${id}' not found` : `${resource} not found`);
    this.name = "NotFoundError";
  }
}

export class DatabaseError extends DALError {
  constructor(message = "Database operation failed") {
    super(message);
    this.name = "DatabaseError";
  }
}

export class ValidationError extends DALError {
  public readonly fieldErrors: Record<string, string[]>;

  constructor(message: string, fieldErrors: Record<string, string[]> = {}) {
    super(message);
    this.name = "ValidationError";
    this.fieldErrors = fieldErrors;
  }
}
