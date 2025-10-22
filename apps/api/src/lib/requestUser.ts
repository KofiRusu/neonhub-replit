import type { Request } from "express";
import type { AuthRequest } from "../middleware/auth.js";
import { AppError } from "./errors.js";

type AuthenticatedUser = NonNullable<AuthRequest["user"]>;

export function getAuthenticatedUser(req: Request): AuthenticatedUser {
  const { user } = req as AuthRequest;

  if (!user) {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  }

  return user;
}

export function getAuthenticatedUserId(req: Request): string {
  return getAuthenticatedUser(req).id;
}
