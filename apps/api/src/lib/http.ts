export type SourceRef = { id: string; title: string; url?: string; updatedAt?: string };
export type ApiResult<T = unknown> = { ok: boolean; data?: T; error?: string; sources?: SourceRef[] };

export const ok = <T>(data: T, sources?: ApiResult["sources"]): ApiResult<T> => ({
  ok: true,
  data,
  ...(sources ? { sources } : {}),
});

export const fail = (error: string, code = 500): { code: number; body: ApiResult } => ({
  code,
  body: { ok: false, error },
});



