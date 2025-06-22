import React, { createContext } from "react";
import type { Prompt, Tool, LLMConfig, Conversation } from "../types";

interface PlaygroundContextType {
  // State
  prompts: Prompt[];
  selectedPrompt: Prompt | null;
  tools: Tool[];
  selectedToolIds: string[];
  config: LLMConfig;
  conversation: Conversation;
  isLoading: boolean;
  error?: string;

  // Actions
  selectPrompt: (prompt: Prompt | null) => void;
  toggleTool: (toolId: string) => void;
  updateConfig: (config: Partial<LLMConfig>) => void;
  updateModel: (model: string) => void;
  sendMessage: (content: string) => void;
  clearConversation: () => void;
  startNewConversation: () => void;
  onOpenSettings: () => void;
}

const PlaygroundContext = createContext<PlaygroundContextType | undefined>(
  undefined
);

export { PlaygroundContext };

interface PlaygroundProviderProps {
  children: React.ReactNode;
  value: PlaygroundContextType;
}

export const PlaygroundProvider: React.FC<PlaygroundProviderProps> = ({
  children,
  value,
}) => {
  return (
    <PlaygroundContext.Provider value={value}>
      {children}
    </PlaygroundContext.Provider>
  );
};
