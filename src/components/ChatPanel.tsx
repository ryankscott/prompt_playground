import React, { useState, useRef, useEffect } from "react";
import { X, Link, Unlink, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { MODELS, getModelInfo } from "../models";
import type { Message, LLMConfig, Prompt, Tool } from "../types";
import { ModelCard } from "./ModelCard";

interface ChatPanelProps {
  id: string;
  messages: Message[];
  config: LLMConfig;
  selectedPrompt?: Prompt | null;
  selectedTools?: Tool[];
  isLoading: boolean;
  error?: string;
  isSynced?: boolean;
  canRemove?: boolean;
  onSendMessage: (content: string, panelId: string) => void;
  onModelChange: (model: string, panelId: string) => void;
  onConfigChange?: (config: Partial<LLMConfig>, panelId: string) => void;
  onRemovePanel?: (panelId: string) => void;
  onToggleSync?: (panelId: string) => void;
  onClearMessages?: (panelId: string) => void;
  // Shared input for synced mode
  sharedInput?: string;
  onSharedInputChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSharedSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  // AI SDK props for first panel
  isFirstPanel?: boolean;
  aiInput?: string;
  aiInputChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  aiSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  id,
  messages,
  config,
  selectedPrompt,
  selectedTools,
  isLoading,
  error,
  isSynced = false,
  canRemove = false,
  onSendMessage,
  onModelChange,
  onConfigChange,
  onRemovePanel,
  onToggleSync,
  onClearMessages,
  sharedInput,
  onSharedInputChange,
  onSharedSubmit,
  isFirstPanel = false,
  aiInput,
  aiInputChange,
  aiSubmit,
}) => {
  const [localInput, setLocalInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleLocalInputChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setLocalInput(e.target.value);
  };

  const handleLocalSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (localInput.trim() && !isLoading) {
      onSendMessage(localInput.trim(), id);
      setLocalInput("");
    }
  };

  const handleClearInput = () => {
    // Clear the message history if callback is provided
    if (onClearMessages) {
      onClearMessages(id);
    }

    // Also clear the input field
    if (isSynced && onSharedInputChange) {
      // For synced mode, clear the shared input
      onSharedInputChange({
        target: { value: "" },
      } as React.ChangeEvent<HTMLTextAreaElement>);
    } else if (isFirstPanel && aiInputChange) {
      // For first panel using AI SDK, clear AI input
      aiInputChange({
        target: { value: "" },
      } as React.ChangeEvent<HTMLTextAreaElement>);
    } else {
      // For local mode, clear the local input
      setLocalInput("");
    }
  };

  const inputValue = (() => {
    if (isSynced && sharedInput !== undefined) {
      return sharedInput;
    }
    if (isFirstPanel && !isSynced && aiInput !== undefined) {
      return aiInput;
    }
    return localInput;
  })();

  const handleInputChange = (() => {
    if (isSynced && onSharedInputChange) {
      return onSharedInputChange;
    }
    if (isFirstPanel && !isSynced && aiInputChange) {
      return aiInputChange;
    }
    return handleLocalInputChange;
  })();

  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    if (isSynced && onSharedSubmit) {
      // onSharedSubmit expects a required event parameter
      if (e) {
        onSharedSubmit(e);
      } else {
        // Create a synthetic event if none provided
        const syntheticEvent = {
          preventDefault: () => {},
          stopPropagation: () => {},
        } as React.FormEvent<HTMLFormElement>;
        onSharedSubmit(syntheticEvent);
      }
    } else if (isFirstPanel && !isSynced && aiSubmit) {
      // Use AI SDK submit for first panel when not synced
      if (e) {
        aiSubmit(e);
      } else {
        // Create a synthetic event if none provided
        const syntheticEvent = {
          preventDefault: () => {},
          stopPropagation: () => {},
        } as React.FormEvent<HTMLFormElement>;
        aiSubmit(syntheticEvent);
      }
    } else {
      handleLocalSubmit(e);
    }
  };

  const currentModel = getModelInfo(config.model);

  return (
    <div className="flex flex-col h-full border border-gray-200 rounded-lg bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        {/* First row - Model selector and controls */}
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-3 flex-1">
            <Select
              value={config.model}
              onValueChange={(model) => onModelChange(model, id)}
            >
              <SelectTrigger className="w-auto min-w-[200px]">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {currentModel?.provider && (
                      <>
                        {currentModel.provider.icon && (
                          <currentModel.provider.icon />
                        )}
                      </>
                    )}
                    <span>{currentModel?.name || config.model}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MODELS).map(([, models]) =>
                  models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 uppercase">
                          {model.provider.icon && <model.provider.icon />}
                        </span>
                        <span>{model.name}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            {/* Sync status */}
            <div className="flex items-center gap-1">
              {isSynced && (
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  Synced
                </span>
              )}
              {onToggleSync && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleSync(id)}
                  title={
                    isSynced
                      ? "Unsync from other panels"
                      : "Sync with other panels"
                  }
                >
                  {isSynced ? <Unlink size={16} /> : <Link size={16} />}
                </Button>
              )}
            </div>

            {/* Clear chat button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearInput}
              title="Clear chat history"
              disabled={messages.length === 0 && !inputValue.trim()}
            >
              <Trash2 size={16} />
            </Button>

            {/* Remove panel */}
            {canRemove && onRemovePanel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemovePanel(id)}
              >
                <X size={16} />
              </Button>
            )}
          </div>
        </div>

        {/* Second row - Model Configuration Controls */}
        {onConfigChange && (
          <div className="px-4 pb-3">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 font-medium whitespace-nowrap">
                  Temperature:
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={config.temperature}
                  onChange={(e) =>
                    onConfigChange(
                      { temperature: parseFloat(e.target.value) },
                      id
                    )
                  }
                  className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  title={`Temperature: ${config.temperature.toFixed(1)}`}
                />
                <span className="text-sm text-gray-700 font-mono min-w-[2rem]">
                  {config.temperature.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 font-medium whitespace-nowrap">
                  Max Tokens:
                </label>
                <input
                  type="range"
                  min="100"
                  max="8000"
                  step="100"
                  value={config.maxTokens}
                  onChange={(e) =>
                    onConfigChange(
                      { maxTokens: parseInt(e.target.value, 10) },
                      id
                    )
                  }
                  className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  title={`Max Tokens: ${config.maxTokens}`}
                />
                <span className="text-sm text-gray-700 font-mono min-w-[3rem]">
                  {config.maxTokens}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 flex flex-col min-h-0">
        {messages.length > 0 ? (
          <MessageList
            messages={messages}
            config={config}
            isLoading={isLoading}
            messagesEndRef={messagesEndRef}
          />
        ) : (
          /* Model information when no messages */
          <div className="flex flex-col items-center justify-center h-full p-8 text-center overflow-y-auto">
            <div className="max-w-md">
              {/* Model details */}
              <ModelCard config={config} selectedPrompt={selectedPrompt} />

              {selectedPrompt && (
                <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-900 mb-1">
                    Selected Prompt
                  </div>
                  <div className="text-sm text-blue-800">
                    {selectedPrompt.name}
                  </div>
                </div>
              )}

              {selectedTools && selectedTools.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <div className="text-sm font-medium text-green-900 mb-1">
                    Active Tools ({selectedTools.length})
                  </div>
                  <div className="text-sm text-green-800">
                    {selectedTools.map((tool) => tool.function.name).join(", ")}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="border-t border-red-200 bg-red-50 p-3">
          <div className="text-red-800 text-sm">{error}</div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 p-4 min-h-18">
        <ChatInput
          disabled={!isFirstPanel || !!error}
          value={inputValue}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          placeholder="Type your message..."
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};
