import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { db } from '@/lib/db/drizzle';
import { user as userTable, tokenAccount } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      try {
        // Check if user exists
        const existingUser = await db
          .select()
          .from(userTable)
          .where(eq(userTable.email, user.email))
          .limit(1);

        if (existingUser.length === 0) {
          // Create new user
          const newUser = await db
            .insert(userTable)
            .values({
              id: crypto.randomUUID(),
              email: user.email,
              displayName: user.name || user.email.split('@')[0],
              photoUrl: user.image || null,
              phoneNumber: null,
            })
            .returning();

          // Create default token account (10,000 free tokens)
          if (newUser.length > 0) {
            await db.insert(tokenAccount).values({
              userId: newUser[0].id,
              balance: 10000,
              planCode: 'FREE',
            });
          }
        } else {
          // Update last login
          await db
            .update(userTable)
            .set({
              lastLoginAt: new Date(),
              photoUrl: user.image || existingUser[0].photoUrl,
            })
            .where(eq(userTable.id, existingUser[0].id));
        }

        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return false;
      }
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        // Fetch user from database to get UUID
        const dbUser = await db
          .select()
          .from(userTable)
          .where(eq(userTable.email, token.email as string))
          .limit(1);

        if (dbUser.length > 0) {
          (session.user as any).id = dbUser[0].id;
        }
      }
      return session;
    },
  },
};
