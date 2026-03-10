import { SignJWT, jwtVerify } from 'jose';

const key = new TextEncoder().encode(process.env.AUTH_SECRET);

const NEWSLETTER_CONFIRM_PURPOSE = 'NEWSLETTER_CONFIRM' as const;
const NEWSLETTER_UNSUBSCRIBE_PURPOSE = 'NEWSLETTER_UNSUBSCRIBE' as const;

export async function signNewsletterToken(email: string): Promise<string> {
  return await new SignJWT({ email, purpose: NEWSLETTER_CONFIRM_PURPOSE })
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

    if (payload.purpose !== NEWSLETTER_CONFIRM_PURPOSE || typeof payload.email !== 'string') {
      return null;
    }

    return payload.email;
  } catch {
    return null;
  }
}

export async function signUnsubscribeToken(email: string): Promise<string> {
  return await new SignJWT({ email, purpose: NEWSLETTER_UNSUBSCRIBE_PURPOSE })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(key);
}

export async function verifyUnsubscribeToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    if (payload.purpose !== NEWSLETTER_UNSUBSCRIBE_PURPOSE || typeof payload.email !== 'string') {
      return null;
    }
    return payload.email;
  } catch {
    return null;
  }
}
