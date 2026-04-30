import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  apiBaseUrl: string;
  apiKey: string;
  streamingEnabled: boolean;
  setApiBaseUrl: (v: string) => void;
  setApiKey: (v: string) => void;
  setStreamingEnabled: (v: boolean) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      apiBaseUrl: import.meta.env.VITE_API_URL || "",
      apiKey: import.meta.env.VITE_API_KEY || "",
      streamingEnabled: true,
      setApiBaseUrl: (apiBaseUrl) => set({ apiBaseUrl }),
      setApiKey: (apiKey) => set({ apiKey }),
      setStreamingEnabled: (streamingEnabled) => set({ streamingEnabled }),
    }),
    {
      name: "aws-rag-settings",
      // Ensure we only try to access window/localStorage after hydration
      onRehydrateStorage: () => (state) => {
        if (state && !state.apiBaseUrl && typeof window !== "undefined") {
          state.setApiBaseUrl(window.location.origin);
        }
      },
    },
  ),
);
