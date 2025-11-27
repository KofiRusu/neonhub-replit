declare module "next" {
  export interface NextApiRequest {
    [key: string]: unknown;
  }

  export interface NextApiResponse<T = any> {
    status(code: number): NextApiResponse<T>;
    json(data: T): NextApiResponse<T>;
  }
}
