import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthUser {
  role: 'owner' | 'cashier' | 'supervisor';
  username: string;
}

interface AuthStore {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      login: (user) => {
        document.cookie = `auth_session=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=${14 * 24 * 60 * 60}`;
        set({ user });
      },
      logout: () => {
        document.cookie = 'auth_session=; path=/; max-age=0';
        set({ user: null });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
