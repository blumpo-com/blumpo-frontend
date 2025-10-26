import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  /**
   * Extends the built-in session types to include our custom user ID field
   */
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extends the JWT token to include our custom fields
   */
  interface JWT {
    id: string;
  }
}
