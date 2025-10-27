import type { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      id: string;
      isBetaUser?: boolean;
    };
  }

  interface User extends DefaultUser {
    id: string;
    isBetaUser?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    isBetaUser?: boolean;
  }
}
