import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) =>
        set({ user, token, isAuthenticated: true }),

      /** Replace current user (e.g. after profile / factory name update). Keeps token. */
      setUser: (user) => set({ user }),

      logout: () =>
        set({ user: null, token: null, isAuthenticated: false }),

      // Helpers
      isAdmin: () => get().user?.role === 'admin',
      isOwner: () => get().user?.role === 'factory_owner',
      factory: () => get().user?.factory ?? null,
      isSubscriptionExpired: () => {
        const f = get().user?.factory;
        if (!f) return false;
        return f.subscription_status === 'expired' || f.subscription_status === 'suspended';
      },
      isSubscriptionActive: () => {
        const f = get().user?.factory;
        if (!f) return true; // admin has no factory, unrestricted
        return f.subscription_status === 'active' || f.subscription_status === 'trial';
      },
      daysUntilExpiry: () => {
        const f = get().user?.factory;
        if (!f?.subscription_end_date) return null;
        const diff = new Date(f.subscription_end_date) - new Date();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
      },
    }),
    {
      name: 'factory-auth',
      partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }),
    }
  )
);

export default useAuthStore;
