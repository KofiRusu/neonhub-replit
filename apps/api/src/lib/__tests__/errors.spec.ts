import { describe, expect, it } from "@jest/globals";
import { AppError, ValidationError, NotFoundError, UnauthorizedError } from "../errors.js";

describe("application errors", () => {
  it("supports custom status codes and error codes", () => {
    const error = new AppError("boom", 503, "UNAVAILABLE");
    expect(error.message).toBe("boom");
    expect(error.statusCode).toBe(503);
    expect(error.code).toBe("UNAVAILABLE");
    expect(error.name).toBe("AppError");
  });

  it("provides specialized subclasses with default metadata", () => {
    const validation = new ValidationError("invalid");
    expect(validation.statusCode).toBe(400);
    expect(validation.code).toBe("VALIDATION_ERROR");

    const notFound = new NotFoundError();
    expect(notFound.statusCode).toBe(404);
    expect(notFound.message).toBe("Resource not found");

    const unauthorized = new UnauthorizedError();
    expect(unauthorized.statusCode).toBe(401);
    expect(unauthorized.code).toBe("UNAUTHORIZED");
  });
});
