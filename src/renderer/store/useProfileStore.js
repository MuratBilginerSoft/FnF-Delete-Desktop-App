import { create } from 'zustand';

const useProfileStore = create((set) => ({
  currentProfile: null,
  profiles: [],

  setCurrentProfile: (profile) => set({ currentProfile: profile }),

  setProfiles: (profiles) => set({ profiles }),

  clearProfile: () => set({ currentProfile: null }),
}));

export default useProfileStore;
