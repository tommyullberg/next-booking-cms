import type { AuthOptions, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "../db";
import { verifyPassword } from "./password";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      email: string;
      name?: string | null;
      mobile?: string | null;
      firstName?: string | null;
      lastName?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    mobile?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    mobile?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  }
}

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || "development-secret-change-in-production",
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    CredentialsProvider({
      name: "Administrator Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const admin = await prisma.administrator.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!admin || !admin.password_hash) {
          return null;
        }

        const isValid = await verifyPassword(
          credentials.password,
          admin.password_hash
        );

        if (!isValid) {
          return null;
        }

        return {
          id: admin.id,
          email: admin.email,
          name: `${admin.first_name} ${admin.last_name}`.trim(),
          firstName: admin.first_name,
          lastName: admin.last_name,
          mobile: admin.mobile,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.mobile = user.mobile;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = (token.id as string) ?? token.sub;
        session.user.firstName = token.firstName as string | null;
        session.user.lastName = token.lastName as string | null;
        session.user.mobile = token.mobile as string | null;
      }
      return session;
    },
  },
};
