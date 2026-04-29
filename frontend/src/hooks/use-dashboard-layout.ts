import { useState, useEffect } from "react";

interface LayoutState {
  panelSizes: number[];
  leftCollapsed: boolean;
  rightCollapsed: boolean;
}

const STORAGE_KEY = "aws-assistant-dashboard-layout";
const DEFAULT_LAYOUT: LayoutState = {
  panelSizes: [22, 53, 25],
  leftCollapsed: false,
  rightCollapsed: false,
};

export function useDashboardLayout() {
  const [layout, setLayout] = useState<LayoutState>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : DEFAULT_LAYOUT;
      } catch (e) {
        console.error("Failed to parse dashboard layout:", e);
        return DEFAULT_LAYOUT;
      }
    }
    return DEFAULT_LAYOUT;
  });

  const updateLayout = (updates: Partial<LayoutState>) => {
    setLayout((prev) => {
      const next = { ...prev, ...updates };
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  const setPanelSizes = (sizes: number[]) => updateLayout({ panelSizes: sizes });
  const setLeftCollapsed = (collapsed: boolean) => updateLayout({ leftCollapsed: collapsed });
  const setRightCollapsed = (collapsed: boolean) => updateLayout({ rightCollapsed: collapsed });

  return {
    ...layout,
    setPanelSizes,
    setLeftCollapsed,
    setRightCollapsed,
  };
}
