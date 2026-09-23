import bcrypt from "bcryptjs";
import { AuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";

export type AppRole = "USER" | "ADMIN";

declare module "next-auth" {
  interface User {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    role: AppRole;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      phone?: string | null;
      role: AppRole;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    role: AppRole;
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session?.user) {
        // only allow profile fields to be refreshed from the client
        const { name, phone } = session.user as { name?: string; phone?: string };
        return { ...token, ...(name ? { name } : {}), ...(phone ? { phone } : {}) };
      }
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.phone = user.phone ?? null;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id,
        name: token.name,
        email: token.email,
        phone: token.phone ?? null,
        role: token.role,
      };
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_JWT_SECRET,
  pages: {
    signIn: "/login",
    error: "/login",
  },
};

export const getAuthServer = () => getServerSession(authOptions);
