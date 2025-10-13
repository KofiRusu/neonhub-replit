export const ALLOW_PATHS = [
  /^apps\/api\//,
  /^apps\/web\//,
  /^packages\//,
  /^scripts\//,
  /^\.github\//
];

export const DENY_PATHS = [
  /^\.env/,
  /^secrets\//,
  /^infra\/prod\//,
  /^deploy\//,
  /^examples\//,
  /^playground\//
];

export function isPathAllowed(p: string): boolean {
  if (DENY_PATHS.some(rx => rx.test(p))) return false;
  return ALLOW_PATHS.some(rx => rx.test(p));
}

