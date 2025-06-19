import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { SidebarContext } from "../hooks/useSidebar";

interface SidebarWrapperProps {
  children: React.ReactNode;
  initialCollapsed?: boolean;
}

export const SidebarWrapper: React.FC<SidebarWrapperProps> = ({
  children,
  initialCollapsed = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  return (
    <SidebarContext.Provider value={{ isCollapsed }}>
      <div
        className={`relative bg-gray-50 border-r border-gray-200 flex flex-col h-full transition-all duration-200 ${
          isCollapsed ? "w-16" : "w-80"
        }`}
      >
        {/* Toggle button positioned absolutely */}
        <div className="absolute bottom-4 -right-3 z-20">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleCollapse}
            className="p-1 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 h-6 w-6"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronLeft size={14} />
            )}
          </Button>
        </div>

        {children}
      </div>
    </SidebarContext.Provider>
  );
};
