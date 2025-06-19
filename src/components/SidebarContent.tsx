import React from "react";
import { useSidebar } from "../hooks/useSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { PromptSidebar } from "./PromptSidebar";
import { ToolSidebar } from "./ToolSidebar";
import type { Prompt, Tool } from "../types";

interface SidebarContentProps {
  currentView: "prompts" | "tools";
  setCurrentView: (view: "prompts" | "tools") => void;
  prompts: Prompt[];
  selectedPrompt: Prompt | null;
  selectPrompt: (prompt: Prompt) => void;
  createPrompt: (name: string, content: string) => void;
  updatePrompt: (id: string, name: string, content: string) => void;
  deletePrompt: (id: string) => void;
  exportPrompts: () => void;
  importPrompts: () => Promise<number>;
  startNewConversation: () => void;
  tools: Tool[];
  selectedToolIds: string[];
  toggleTool: (toolId: string) => void;
  createTool: (
    name: string,
    description: string,
    parameters: {
      name: string;
      type: "string" | "number" | "boolean" | "array" | "object";
      description: string;
      required: boolean;
      enum?: string[];
    }[],
    code: string,
    emoji?: string
  ) => void;
  updateTool: (
    id: string,
    name: string,
    description: string,
    parameters: {
      name: string;
      type: "string" | "number" | "boolean" | "array" | "object";
      description: string;
      required: boolean;
      enum?: string[];
    }[],
    code: string,
    emoji?: string
  ) => void;
  deleteTool: (id: string) => void;
  exportTools: () => void;
  importTools: () => Promise<number>;
}

export const SidebarContent: React.FC<SidebarContentProps> = ({
  currentView,
  setCurrentView,
  prompts,
  selectedPrompt,
  selectPrompt,
  createPrompt,
  updatePrompt,
  deletePrompt,
  exportPrompts,
  importPrompts,
  startNewConversation,
  tools,
  selectedToolIds,
  toggleTool,
  createTool,
  updateTool,
  deleteTool,
  exportTools,
  importTools,
}) => {
  // Get the isCollapsed state from the SidebarWrapper context
  const { isCollapsed } = useSidebar();

  return (
    <Tabs
      value={currentView}
      onValueChange={(value) => setCurrentView(value as "prompts" | "tools")}
      className="flex flex-col h-full w-full"
    >
      <div
        className={`p-2 w-full items-center justify-center ${
          isCollapsed ? "hidden" : "flex"
        }`}
      >
        <TabsList className={`${isCollapsed ? "hidden" : "flex"}`}>
          <TabsTrigger value="prompts">Prompts</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="prompts" className="h-full m-0">
        <PromptSidebar
          prompts={prompts}
          selectedPromptId={selectedPrompt?.id}
          onSelectPrompt={selectPrompt}
          onCreatePrompt={createPrompt}
          onUpdatePrompt={updatePrompt}
          onDeletePrompt={deletePrompt}
          onExportPrompts={exportPrompts}
          onImportPrompts={importPrompts}
          onStartNewConversation={startNewConversation}
          isCollapsed={isCollapsed}
        />
      </TabsContent>
      <TabsContent value="tools" className="h-full m-0">
        <ToolSidebar
          tools={tools}
          selectedToolIds={selectedToolIds}
          onToggleTool={toggleTool}
          onCreateTool={createTool}
          onUpdateTool={updateTool}
          onDeleteTool={deleteTool}
          onExportTools={exportTools}
          onImportTools={importTools}
          isCollapsed={isCollapsed}
        />
      </TabsContent>
    </Tabs>
  );
};
