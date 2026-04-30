import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SessionLog } from "./types.ts";

interface LogsState {
  logs: SessionLog[];
  addLog: (log: SessionLog) => void;
  clear: () => void;
}

export const useSessionLogs = create<LogsState>()(
  persist(
    (set) => ({
      logs: [],
      addLog: (log) => set((s) => ({ logs: [log, ...s.logs].slice(0, 50) })),
      clear: () => set({ logs: [] }),
    }),
    { name: "aws-rag-logs" },
  ),
);
