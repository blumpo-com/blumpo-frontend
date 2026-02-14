import { z } from 'zod';
import { User } from '@/lib/db/schema';
import { UserRole } from '@/lib/db/schema/enums';
import { getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { getAdminUser } from './admin';

export type ActionState = {
  error?: string;
  success?: string;
  [key: string]: any; // This allows for additional properties
};

type ValidatedActionFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData
) => Promise<T>;

export function validatedAction<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData) => {
    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.errors[0].message };
    }

    return action(result.data, formData);
  };
}

type ValidatedActionWithUserFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData,
  user: User
) => Promise<T>;

export function validatedActionWithUser<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionWithUserFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData) => {
    const user = await getUser();
    if (!user) {
      throw new Error('User is not authenticated');
    }

    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.errors[0].message };
    }

    return action(result.data, formData, user);
  };
}

// Simple user authentication wrapper for actions
type UserActionFunction = (formData: FormData, user: User) => Promise<void>;

export function withUser(action: UserActionFunction) {
  return async (formData: FormData) => {
    const user = await getUser();
    if (!user) {
      redirect('/sign-in?redirect=dashboard');
    }

    return action(formData, user);
  };
}

// Admin-only action wrappers

type AdminActionFunction = (formData: FormData, admin: User & { role: UserRole.ADMIN }) => Promise<void>;

export function withAdmin(action: AdminActionFunction) {
  return async (formData: FormData) => {
    const admin = await getAdminUser();
    if (!admin) {
      redirect('/dashboard?error=unauthorized');
    }

    return action(formData, admin);
  };
}

type ValidatedActionWithAdminFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,
  formData: FormData,
  admin: User & { role: UserRole.ADMIN }
) => Promise<T>;

export function validatedActionWithAdmin<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionWithAdminFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData) => {
    const admin = await getAdminUser();
    if (!admin) {
      throw new Error('Admin access required');
    }

    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.errors[0].message };
    }

    return action(result.data, formData, admin);
  };
}
