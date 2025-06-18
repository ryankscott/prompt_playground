import React, { useState } from "react";
import { MessageSquare, Split } from "lucide-react";
import type { Message, LLMConfig, Prompt } from "../types";
import { ChatInterface } from "./ChatInterface";
import { ABTestInterface } from "./ABTestInterface";

interface TabbedChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  error?: string;
  config: LLMConfig;
  selectedPrompt?: Prompt | null;
  onOpenSettings: () => void;
  onClearConversation?: () => void;
  onStartNewConversation?: () => void;
  onModelChange?: (model: string) => void;
}

export const TabbedChatInterface: React.FC<TabbedChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading,
  error,
  config,
  selectedPrompt,
  onOpenSettings,
  onClearConversation,
  onStartNewConversation,
  onModelChange,
}) => {
  const [activeTab, setActiveTab] = useState<"chat" | "ab-test">("chat");

  const tabs = [
    {
      id: "chat" as const,
      name: "Chat",
      icon: MessageSquare,
    },
    {
      id: "ab-test" as const,
      name: "A/B Test",
      icon: Split,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-4" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  isActive
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon size={16} />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "chat" && (
          <ChatInterface
            messages={messages}
            onSendMessage={onSendMessage}
            isLoading={isLoading}
            error={error}
            config={config}
            selectedPrompt={selectedPrompt}
            onOpenSettings={onOpenSettings}
            onClearConversation={onClearConversation}
            onStartNewConversation={onStartNewConversation}
            onModelChange={onModelChange}
          />
        )}
        {activeTab === "ab-test" && (
          <ABTestInterface
            selectedPrompt={selectedPrompt}
            onOpenSettings={onOpenSettings}
            config={config}
          />
        )}
      </div>
    </div>
  );
};
