import { create } from 'zustand';

const isBrowser = typeof window !== 'undefined';

const getInitialToken = () => {
  if (!isBrowser) return null;
  return localStorage.getItem('lipistry_token');
};

const getInitialUser = () => {
  if (!isBrowser) return null;
  const user = localStorage.getItem('lipistry_user');
  try {
    return user ? JSON.parse(user) : null;
  } catch (e) {
    return null;
  }
};

export const useAuthStore = create((set) => ({
  token: getInitialToken(),
  user: getInitialUser(),
  isAuthenticated: !!getInitialToken(),
  isLoading: false,
  error: null,

  setAuth: (token, user) => {
    if (isBrowser) {
      localStorage.setItem('lipistry_token', token);
      localStorage.setItem('lipistry_user', JSON.stringify(user));
      // Set cookies for middleware
      document.cookie = `lipistry_token=${token}; path=/; max-age=86400; SameSite=Strict`;
      document.cookie = `lipistry_role=${user.role}; path=/; max-age=86400; SameSite=Strict`;
    }
    set({ token, user, isAuthenticated: true, error: null });
  },

  clearAuth: () => {
    if (isBrowser) {
      localStorage.removeItem('lipistry_token');
      localStorage.removeItem('lipistry_user');
      // Clear cookies for middleware
      document.cookie = 'lipistry_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'lipistry_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
    set({ token: null, user: null, isAuthenticated: false, error: null });
  },

  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ isLoading }),
}));
