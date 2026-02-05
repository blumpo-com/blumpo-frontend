'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import useSWR, { mutate } from 'swr';
import { User, TokenAccount } from '@/lib/db/schema';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type UserWithTokenAccount = User & {
  tokenAccount: TokenAccount | null;
};

interface UserContextType {
  user: UserWithTokenAccount | null;
  isLoading: boolean;
  isInitialized: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useSWR<UserWithTokenAccount>('/api/user', fetcher, {
    revalidateOnFocus: false,
    revalidateOnMount: true,
    revalidateIfStale: false,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
    keepPreviousData: true,
  });
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setIsInitialized(true);
    }
  }, [isLoading]);

  const refreshUser = async () => {
    // Trigger SWR to revalidate the user data
    await mutate('/api/user');
  };

  return (
    <UserContext.Provider value={{ user: user || null, isLoading, isInitialized, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

