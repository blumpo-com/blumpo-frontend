import { eq } from 'drizzle-orm';
import { db } from '../drizzle';
import { newsletterSubscription } from '../schema/index';

export async function isEmailSubscribed(email: string): Promise<boolean> {
  const result = await db
    .select({ id: newsletterSubscription.id })
    .from(newsletterSubscription)
    .where(eq(newsletterSubscription.email, email.toLowerCase()))
    .limit(1);

  return result.length > 0;
}

/**
 * Adds a confirmed newsletter subscriber.
 * Always sets confirmedAt to now — only call this after identity is verified
 * (either via known user account or via email confirmation link).
 */
export async function addNewsletterSubscriber(email: string, userId?: string) {
  const result = await db
    .insert(newsletterSubscription)
    .values({
      email: email.toLowerCase(),
      userId,
      confirmedAt: new Date(),
    })
    .returning();

  return result[0];
}
