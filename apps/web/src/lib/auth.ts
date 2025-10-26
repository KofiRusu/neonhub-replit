import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const demoEmail =
  process.env.DEMO_LOGIN_EMAIL?.toLowerCase() ?? "demo@neonhub.ai";
const demoPassword = process.env.DEMO_LOGIN_PASSWORD ?? "demo-access";
const demoName = process.env.DEMO_LOGIN_NAME ?? "NeonHub Demo";
const demoUserId = process.env.DEMO_LOGIN_USER_ID ?? "demo-user";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Demo Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase();
        const password = credentials?.password;

        if (email === demoEmail && password === demoPassword) {
          return {
            id: demoUserId,
            email: demoEmail,
            name: demoName,
            isBetaUser: true,
          };
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.isBetaUser = (user as { isBetaUser?: boolean })?.isBetaUser ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.id === "string" ? token.id : demoUserId;
        session.user.email = token.email as string | undefined;
        session.user.name = token.name as string | undefined;
        session.user.isBetaUser = Boolean(token.isBetaUser);
      }
      return session;
    },
  },
};
