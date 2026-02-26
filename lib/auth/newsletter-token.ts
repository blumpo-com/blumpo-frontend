import { SignJWT, jwtVerify } from 'jose';

const key = new TextEncoder().encode(process.env.AUTH_SECRET);

const NEWSLETTER_PURPOSE = 'NEWSLETTER_CONFIRM' as const;

export async function signNewsletterToken(email: string): Promise<string> {
  return await new SignJWT({ email, purpose: NEWSLETTER_PURPOSE })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
}

export async function verifyNewsletterToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });

    if (payload.purpose !== NEWSLETTER_PURPOSE || typeof payload.email !== 'string') {
      return null;
    }

    return payload.email;
  } catch {
    return null;
  }
}
