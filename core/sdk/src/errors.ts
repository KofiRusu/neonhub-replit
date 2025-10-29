/**
 * Base error class for all NeonHub SDK errors
 */
export class NeonHubError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode?: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'NeonHubError';
    Object.setPrototypeOf(this, NeonHubError.prototype);
  }
}

/**
 * Error thrown when API request fails
 */
export class APIError extends NeonHubError {
  constructor(
    message: string,
    statusCode: number,
    public readonly response?: unknown
  ) {
    super(message, 'API_ERROR', statusCode, response);
    this.name = 'APIError';
    Object.setPrototypeOf(this, APIError.prototype);
  }
}

/**
 * Error thrown when agent execution fails
 */
export class AgentError extends NeonHubError {
  constructor(
    message: string,
    public readonly agentName?: string,
    details?: unknown
  ) {
    super(message, 'AGENT_ERROR', undefined, details);
    this.name = 'AgentError';
    Object.setPrototypeOf(this, AgentError.prototype);
  }
}

/**
 * Error thrown when input validation fails
 */
export class ValidationError extends NeonHubError {
  constructor(message: string, public readonly errors?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, errors);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error thrown when rate limit is exceeded
 */
export class RateLimitError extends NeonHubError {
  constructor(
    message: string = 'Rate limit exceeded',
    public readonly retryAfter?: number
  ) {
    super(message, 'RATE_LIMIT_ERROR', 429, { retryAfter });
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Error thrown when authentication fails
 */
export class AuthenticationError extends NeonHubError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Error thrown when authorization fails
 */
export class AuthorizationError extends NeonHubError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Error thrown when resource is not found
 */
export class NotFoundError extends NeonHubError {
  constructor(message: string, public readonly resource?: string) {
    super(message, 'NOT_FOUND', 404, { resource });
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Error thrown when network request times out
 */
export class TimeoutError extends NeonHubError {
  constructor(message: string = 'Request timeout', public readonly timeout?: number) {
    super(message, 'TIMEOUT_ERROR', 408, { timeout });
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

