import { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";

type OriginMatcher = (origin: string) => boolean;

const escapeRegExp = (value: string) =>
  value.replace(/[-/\\^$+?.()|[\]{}]/g, "\\$&");

const buildMatchers = (origins: string[]): OriginMatcher[] => {
  if (!origins.length) {
    return [];
  }

  return origins.map((origin) => {
    const trimmed = origin.trim();

    if (!trimmed) {
      return () => false;
    }

    if (trimmed === "*" || trimmed.toLowerCase() === "all") {
      return () => true;
    }

    if (trimmed.startsWith("regex:")) {
      const pattern = trimmed.slice(6);
      try {
        const regex = new RegExp(pattern);
        return (value: string) => regex.test(value);
      } catch {
        return (value: string) => value === trimmed;
      }
    }

    if (trimmed.includes("*")) {
      const regex = new RegExp(
        `^${escapeRegExp(trimmed).replace(/\\\*/g, ".*")}$`
      );
      return (value: string) => regex.test(value);
    }

    return (value: string) => value === trimmed;
  });
};

const allowedOrigins = buildMatchers(env.CORS_ORIGINS);

const isOriginAllowed = (origin?: string | null) => {
  if (!origin) {
    return false;
  }

  if (!allowedOrigins.length) {
    return false;
  }

  return allowedOrigins.some((match) => match(origin));
};

export function strictCORS(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;
  const allowed = isOriginAllowed(origin);

  if (allowed && origin) {
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");

    const requestHeaders =
      (req.headers["access-control-request-headers"] as string | undefined) ??
      "Content-Type, Authorization";

    res.setHeader("Access-Control-Allow-Headers", requestHeaders);
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    );
  }

  if (req.method === "OPTIONS") {
    return allowed ? res.status(204).end() : res.status(403).end();
  }

  if (origin && !allowed) {
    return res.status(403).json({ error: "CORS blocked" });
  }

  next();
}
