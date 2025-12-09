import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { db } from '@/lib/db/drizzle';
import { user as userTable, tokenAccount } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { setSession } from '@/lib/auth/session';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/sign-in',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;

      try {
        let dbUser;
        
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
              displayName: user.name || null,
              photoUrl: user.image || null,
              phoneNumber: null,
              lastLoginAt: new Date(),
            })
            .returning();

          if (newUser.length > 0) {
            dbUser = newUser[0];
            
            // Create default token account (50 tokens for FREE plan)
            await db.insert(tokenAccount).values({
              userId: dbUser.id,
              balance: 50,
              planCode: 'FREE',
            });
          }
        } else {
          // Update last login
          const updatedUser = await db
            .update(userTable)
            .set({
              lastLoginAt: new Date(),
              photoUrl: user.image || existingUser[0].photoUrl,
              displayName: user.name || existingUser[0].displayName || null,
            })
            .where(eq(userTable.id, existingUser[0].id))
            .returning();
          
          dbUser = updatedUser[0] || existingUser[0];
        }

        // Set our custom session (same as OTP flow)
        if (dbUser) {
          await setSession(dbUser);
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
    async redirect({ url, baseUrl }) {
      // Handle redirect parameter from URL
      try {
        // Check if URL is relative first
        if (url.startsWith('/')) {
          // For relative URLs, check if it's the callback endpoint
          if (url.startsWith('/api/auth/')) {
            // For auth callbacks, redirect to dashboard
            return `${baseUrl}/dashboard`;
          }
          return `${baseUrl}${url}`;
        }
        
        // Only parse as URL if it's absolute
        const urlObj = new URL(url);
        const redirectParam = urlObj.searchParams.get('redirect');
        const priceId = urlObj.searchParams.get('priceId');
        
        if (redirectParam === 'checkout' && priceId) {
          return `${baseUrl}/pricing?priceId=${priceId}`;
        }
        
        if (redirectParam === 'checkout') {
          return `${baseUrl}/pricing`;
        }
        
        // If URL is already absolute and on same domain
        if (url.startsWith(baseUrl)) {
          return url;
        }
        
        // Default redirect
        return `${baseUrl}/dashboard`;
      } catch (error) {
        console.error('Error in redirect callback:', error);
        return `${baseUrl}/dashboard`;
      }
    },
  },
};
