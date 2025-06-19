import { createContext, useContext } from "react";

// Create a context to provide the collapsed state
export interface SidebarContextType {
  isCollapsed: boolean;
}

export const SidebarContext = createContext<SidebarContextType | undefined>(
  undefined
);

// Custom hook to access the sidebar context
export const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarWrapper");
  }
  return context;
};
