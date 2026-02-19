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
        let isNewUser = false;
        
        // Check if user exists
        const existingUser = await db
          .select()
          .from(userTable)
          .where(eq(userTable.email, user.email))
          .limit(1);

        if (existingUser.length === 0) {
          isNewUser = true;
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

        // Store isNewUser in account object for use in redirect callback
        if (account) {
          (account as any).isNewUser = isNewUser;
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
        let urlObj: URL;
        
        // Parse URL - handle both relative and absolute
        if (url.startsWith('/')) {
          // Relative URL - construct full URL
          urlObj = new URL(url, baseUrl);
        } else {
          // Absolute URL
          urlObj = new URL(url);
        }

        // Check if this is coming from a Google OAuth callback
        // NextAuth passes the callback URL or the intended redirect URL here
        const isGoogleOAuthCompletion = urlObj.pathname.includes('/api/auth/callback/google') || 
                                       urlObj.searchParams.has('code') && urlObj.searchParams.has('state');

        // Only parse as URL if it's absolute
        const redirectParam = urlObj.searchParams.get('redirect');
        const plan = urlObj.searchParams.get('plan');
        const interval = urlObj.searchParams.get('interval');
        const websiteUrl = urlObj.searchParams.get('website_url');
        
        // Build GTM auth params for Google OAuth (isNewUser detected client-side)
        const authParams = new URLSearchParams();
        if (isGoogleOAuthCompletion) {
          authParams.set('auth', 'success');
          authParams.set('method', 'google');
        }
        
        // Handle input-url redirect (after CTA "Make your first free Ad")
        if (redirectParam === 'input-url') {
          const finalUrl = `${baseUrl}/input-url`;
          return isGoogleOAuthCompletion ? `${finalUrl}?${authParams.toString()}` : finalUrl;
        }

        // Handle checkout redirect
        if (redirectParam === 'checkout') {
          if (plan) {
            const params = new URLSearchParams();
            params.set('plan', plan);
            if (interval) {
              params.set('interval', interval);
            }
            // Add auth params if Google OAuth
            if (isGoogleOAuthCompletion) {
              authParams.forEach((value, key) => params.set(key, value));
            }
            return `${baseUrl}/dashboard/your-credits?${params.toString()}`;
          } else {
            const finalUrl = `${baseUrl}/dashboard/your-credits`;
            return isGoogleOAuthCompletion ? `${finalUrl}?${authParams.toString()}` : finalUrl;
          }
        }

        if (redirectParam === 'dashboard') {
          const finalUrl = `${baseUrl}/dashboard`;
          return isGoogleOAuthCompletion ? `${finalUrl}?${authParams.toString()}` : finalUrl;
        }
        
        // Handle generation redirect - redirect to root with params (oauth-redirect-handler will start generation)
        if (redirectParam === 'generate' && websiteUrl) {
          const params = `website_url=${encodeURIComponent(websiteUrl)}&login=true`;
          return isGoogleOAuthCompletion 
            ? `${baseUrl}/generating?${params}&${authParams.toString()}`
            : `${baseUrl}/generating?${params}`;
        }
        
        // For Google OAuth completion, always add auth params to redirect
        if (isGoogleOAuthCompletion) {
          // Default to dashboard with auth params
          return `${baseUrl}/dashboard?${authParams.toString()}`;
        }
        
        // For other auth callback URLs, redirect to root (/) - cookie handler will check for redirect params
        if (urlObj.pathname.startsWith('/api/auth/callback')) {
          // Redirect to root - the OAuthRedirectHandler component will check the cookie
          // and redirect to the appropriate page with query params
          return `${baseUrl}/`;
        }
         // If URL is already absolute and on same domain, return as-is
         if (url.startsWith(baseUrl)) {
          return url;
        }
        
        // For relative URLs without special handling, construct full URL
        if (url.startsWith('/')) {
          return `${baseUrl}${url}`;
        }        // Default redirect
        return `${baseUrl}/`;
      } catch (error) {
        console.error('Error in redirect callback:', error);
        return `${baseUrl}/`;
      }
    },
  },
};
