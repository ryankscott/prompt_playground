import React, { useState, useRef, useEffect } from "react";
import { RotateCcw, MessageSquarePlus, Wrench } from "lucide-react";
import type {
  ChatProps,
  ModelConfigProps,
  PromptToolProps,
  AiSdkProps,
} from "../types";
import { Button } from "./ui/button";
import { ModelSelector } from "./ModelSelector";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";

interface ChatInterfaceProps
  extends ChatProps,
    ModelConfigProps,
    PromptToolProps,
    AiSdkProps {
  showHeader?: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading,
  error,
  config,
  selectedPrompt,
  selectedTools,
  onOpenSettings,
  onClearConversation,
  onStartNewConversation,
  onModelChange,
  showHeader = true,
  // AI SDK props
  input: aiInput,
  handleInputChange: aiHandleInputChange,
  handleSubmit: aiHandleSubmit,
  reload,
}) => {
  // Use AI SDK input/state if provided, otherwise use local state
  const [localInput, setLocalInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Ensure scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Determine whether to use AI SDK's state or local state
  const useAiSdk =
    aiInput !== undefined &&
    aiHandleInputChange !== undefined &&
    aiHandleSubmit !== undefined;
  const inputValue = useAiSdk ? aiInput : localInput;

  const handleLocalInputChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setLocalInput(e.target.value);
  };

  const handleLocalSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (localInput.trim() && !isLoading) {
      onSendMessage(localInput.trim());
      setLocalInput("");
    }
  };

  const handleInputChange = useAiSdk
    ? aiHandleInputChange
    : handleLocalInputChange;
  const handleSubmit = useAiSdk
    ? (e?: React.FormEvent<HTMLFormElement>) => {
        if (aiHandleSubmit) {
          if (e) e.preventDefault();
          const formEvent = new Event(
            "submit"
          ) as unknown as React.FormEvent<HTMLFormElement>;
          aiHandleSubmit(formEvent);
        }
      }
    : handleLocalSubmit;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      {showHeader && (
        <div className="border-b border-gray-200 p-4">
          <div className="w-full max-w-full mx-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-gray-900">
                {selectedPrompt ? selectedPrompt.name : "Prompt Playground"}
              </h1>
              {selectedTools && selectedTools.length > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                  <Wrench size={12} />
                  <span>
                    {selectedTools.length} tool
                    {selectedTools.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <ModelSelector
                config={config}
                onModelChange={onModelChange}
                onOpenSettings={onOpenSettings}
              />
              {selectedPrompt && onClearConversation && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearConversation}
                  className="flex items-center gap-1"
                >
                  <RotateCcw size={14} />
                  Clear
                </Button>
              )}
              {onStartNewConversation && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onStartNewConversation}
                  className="flex items-center gap-1"
                >
                  <MessageSquarePlus size={14} />
                  New
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={messages}
          config={config}
          isLoading={isLoading}
          messagesEndRef={messagesEndRef}
        />
      </div>

      {/* Error display */}
      {error && (
        <div className="border-t border-red-200 bg-red-50 p-3">
          <div className="text-red-800 text-sm flex items-center justify-between">
            <span>{error}</span>
            {reload && (
              <Button variant="outline" size="sm" onClick={reload}>
                Retry
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <ChatInput
          value={inputValue}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          placeholder="Type your message..."
          disabled={!!(error && !reload)}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};
