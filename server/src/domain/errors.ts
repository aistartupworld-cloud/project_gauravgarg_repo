/**
 * Domain errors carry a stable machine-readable `code`; the HTTP layer maps codes to status codes.
 * Class names are part of the contract (the brief names InvalidAuditStateException).
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_FAILED';
  constructor(readonly fields: Record<string, string>) {
    super(`Invalid input: ${Object.entries(fields).map(([k, v]) => `${k} ${v}`).join('; ')}`);
  }
}

export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND';
}

export class ConflictError extends DomainError {
  readonly code = 'CONFLICT';
}

export class UnauthorizedError extends DomainError {
  readonly code = 'UNAUTHENTICATED';
}

export class ForbiddenError extends DomainError {
  readonly code = 'FORBIDDEN';
}

export class InvalidAuditStateException extends DomainError {
  readonly code = 'INVALID_AUDIT_STATE';
}

export class InvalidFindingStateException extends DomainError {
  readonly code = 'INVALID_FINDING_STATE';
}

export class SeparationOfDutiesViolation extends DomainError {
  readonly code = 'SOD_VIOLATION';
}

export class ImmutableRecordError extends DomainError {
  readonly code = 'IMMUTABLE_RECORD';
}

/** Collects field errors and throws one ValidationError at the end. */
export class FieldErrors {
  private readonly errors: Record<string, string> = {};

  add(field: string, message: string): this {
    if (!(field in this.errors)) this.errors[field] = message;
    return this;
  }

  check(condition: boolean, field: string, message: string): this {
    if (!condition) this.add(field, message);
    return this;
  }

  get isEmpty(): boolean {
    return Object.keys(this.errors).length === 0;
  }

  throwIfAny(): void {
    if (!this.isEmpty) throw new ValidationError({ ...this.errors });
  }
}
