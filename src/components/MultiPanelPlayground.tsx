import React, { useState, useCallback } from "react";
import { Plus, Settings } from "lucide-react";
import type { Message, LLMConfig, Prompt, Tool } from "../types";
import { Button } from "./ui/button";
import { ChatPanel } from "./ChatPanel";
import { createApiCall } from "../utils";
import { v4 as uuidv4 } from "uuid";

interface ChatInstance {
  id: string;
  config: LLMConfig;
  messages: Message[];
  isLoading: boolean;
  error?: string;
  conversationId: string;
}

interface MultiPanelPlaygroundProps {
  selectedPrompt?: Prompt | null;
  selectedTools?: Tool[];
  onOpenSettings: () => void;
  onClearConversation?: () => void;
  onStartNewConversation?: () => void;
  onModelChange?: (model: string) => void;
  onConfigChange?: (config: Partial<LLMConfig>) => void;
  config: LLMConfig;

  // AI SDK props for the first panel
  input?: string;
  handleInputChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  status?: "submitted" | "streaming" | "ready" | "error";
  reload?: () => Promise<void>;
  stop?: () => void;
  aiMessages?: Message[];
}

export const MultiPanelPlayground: React.FC<MultiPanelPlaygroundProps> = ({
  selectedPrompt,
  selectedTools,
  onOpenSettings,
  onClearConversation,
  onModelChange,
  onConfigChange,
  config,
  input,
  handleInputChange,
  handleSubmit,
  status,
  aiMessages = [],
}) => {
  // Initialize with the main chat instance
  const [chatInstances, setChatInstances] = useState<ChatInstance[]>([
    {
      id: uuidv4(),
      config,
      messages: aiMessages,
      isLoading: status === "streaming" || status === "submitted",
      conversationId: "main",
    },
  ]);

  const [syncSettings, setSyncSettings] = useState(true);
  const [sharedInput, setSharedInput] = useState("");

  const updateChatInstance = useCallback(
    (id: string, updates: Partial<ChatInstance>) => {
      setChatInstances((prev) =>
        prev.map((instance) =>
          instance.id === id ? { ...instance, ...updates } : instance
        )
      );
    },
    []
  );

  const addChatPanel = useCallback(() => {
    const newInstance: ChatInstance = {
      id: uuidv4(),
      config: { ...config },
      messages: selectedPrompt
        ? [
            {
              id: uuidv4(),
              role: "system",
              content: selectedPrompt.content,
              timestamp: new Date(),
            },
          ]
        : [],
      isLoading: false,
      conversationId: uuidv4(),
    };

    setChatInstances((prev) =>
      [...prev, newInstance].map((instance) => ({
        ...instance,
        messages: [],
      }))
    );
  }, [config, selectedPrompt]);

  // Handle sending messages for individual panels
  const handleSendMessage = useCallback(
    async (content: string, panelId: string) => {
      let instance: ChatInstance | undefined;

      setChatInstances((prev) => {
        instance = prev.find((i) => i.id === panelId);
        return prev;
      });

      if (!instance || instance.isLoading) return;

      const userMessage: Message = {
        id: uuidv4(),
        role: "user",
        content,
        timestamp: new Date(),
      };

      // Add user message and set loading
      const updatedMessages = [...instance.messages, userMessage];
      updateChatInstance(panelId, {
        messages: updatedMessages,
        isLoading: true,
        error: undefined,
      });

      try {
        // Prepare messages for API call
        const messagesToSend = [];
        if (selectedPrompt) {
          messagesToSend.push({
            id: uuidv4(),
            role: "system" as const,
            content: selectedPrompt.content,
            timestamp: new Date(),
          });
        }
        messagesToSend.push(userMessage);

        // Create assistant message placeholder
        const assistantId = uuidv4();
        const assistantMessage: Message = {
          id: assistantId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
        };

        updateChatInstance(panelId, {
          messages: [...updatedMessages, assistantMessage],
        });

        // Stream the response
        const onChunk = (chunk: string) => {
          setChatInstances((prev) =>
            prev.map((inst) => {
              if (inst.id === panelId) {
                return {
                  ...inst,
                  messages: inst.messages.map((msg) =>
                    msg.id === assistantId
                      ? { ...msg, content: msg.content + chunk }
                      : msg
                  ),
                  // Set isLoading to false when content starts streaming
                  isLoading: false,
                };
              }
              return inst;
            })
          );
        };

        const result = await createApiCall(
          messagesToSend,
          instance.config,
          selectedTools || [],
          onChunk
        );

        // Update with final result
        updateChatInstance(panelId, {
          messages: [
            ...updatedMessages,
            {
              ...assistantMessage,
              content: result.content,
              metadata: result.metadata,
              toolCalls: result.toolCalls,
            },
          ],
          isLoading: false,
        });
      } catch (error) {
        updateChatInstance(panelId, {
          isLoading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        console.error("Chat API Error:", error);
      }
    },
    [selectedPrompt, selectedTools, updateChatInstance]
  );

  const handleModelChange = useCallback(
    (model: string, panelId: string) => {
      let isFirstPanel = false;
      let instance: ChatInstance | undefined;

      setChatInstances((prev) => {
        isFirstPanel = prev[0]?.id === panelId;
        instance = prev.find((i) => i.id === panelId);
        return prev;
      });

      if (!instance) return;

      updateChatInstance(panelId, {
        config: { ...instance.config, model },
      });

      // If synced settings and this is the first panel, update the main config
      if (isFirstPanel && syncSettings && onModelChange) {
        onModelChange(model);
      }
    },
    [syncSettings, onModelChange, updateChatInstance]
  );

  const handleConfigChange = useCallback(
    (configUpdates: Partial<LLMConfig>, panelId: string) => {
      let isFirstPanel = false;
      let instance: ChatInstance | undefined;

      setChatInstances((prev) => {
        isFirstPanel = prev[0]?.id === panelId;
        instance = prev.find((i) => i.id === panelId);
        return prev;
      });

      if (!instance) return;

      updateChatInstance(panelId, {
        config: { ...instance.config, ...configUpdates },
      });

      // If synced settings and this is the first panel, update the main config
      if (isFirstPanel && syncSettings && onConfigChange) {
        onConfigChange(configUpdates);
      }
    },
    [syncSettings, onConfigChange, updateChatInstance]
  );

  const removeChatPanel = useCallback((panelId: string) => {
    setChatInstances((prev) =>
      prev.filter((instance) => instance.id !== panelId)
    );
  }, []);

  // Handle shared input for synced mode
  const handleSharedInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setSharedInput(e.target.value);
      if (handleInputChange) {
        handleInputChange(e);
      }
    },
    [handleInputChange]
  );

  const handleSharedSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (syncSettings && (sharedInput.trim() || input?.trim())) {
        const messageContent = sharedInput.trim() || input?.trim() || "";

        if (!messageContent) return;

        // Get current instances
        let currentInstances: ChatInstance[] = [];
        setChatInstances((prev) => {
          currentInstances = prev;
          return prev;
        });

        // For the first panel, use AI SDK's handleSubmit if available
        const firstInstance = currentInstances[0];
        if (firstInstance && handleSubmit) {
          // Let AI SDK handle the first panel
          handleSubmit(e);
        }

        // For other panels, send manually
        const otherInstances = currentInstances.slice(1);
        const promises = otherInstances.map((instance) =>
          handleSendMessage(messageContent, instance.id)
        );

        await Promise.all(promises);
        setSharedInput("");
      } else if (handleSubmit) {
        handleSubmit(e);
      }
    },
    [syncSettings, sharedInput, input, handleSendMessage, handleSubmit]
  );

  // Update the first instance when AI SDK messages change
  React.useEffect(() => {
    setChatInstances((prev) => {
      if (prev.length > 0) {
        const firstInstance = prev[0];
        return [
          {
            ...firstInstance,
            messages: aiMessages,
            isLoading: status === "streaming" || status === "submitted",
            error: status === "error" ? "An error occurred" : undefined,
          },
          ...prev.slice(1),
        ];
      }
      return prev;
    });
  }, [aiMessages, status]);

  // Update all instances when config changes and sync is enabled
  React.useEffect(() => {
    if (syncSettings) {
      setChatInstances((prev) =>
        prev.map((instance, index) =>
          index === 0 ? { ...instance, config } : instance
        )
      );
    }
  }, [config, syncSettings]);

  const gridCols =
    chatInstances.length === 1
      ? "grid-cols-1"
      : chatInstances.length === 2
      ? "grid-cols-2"
      : chatInstances.length === 3
      ? "grid-cols-3"
      : "grid-cols-2";

  // Handle clearing messages for individual panels
  const handleClearMessages = useCallback(
    (panelId: string) => {
      setChatInstances((prev) => {
        const isFirstPanel = prev[0]?.id === panelId;

        if (isFirstPanel && onClearConversation) {
          // For the first panel using AI SDK, use the provided clear function
          onClearConversation();
          return prev.map((instance) =>
            instance.id === panelId ? { ...instance, messages: [] } : instance
          );
        } else {
          // For other panels, just clear the messages
          return prev.map((instance) =>
            instance.id === panelId
              ? {
                  ...instance,
                  messages: selectedPrompt
                    ? [
                        {
                          id: uuidv4(),
                          role: "system" as const,
                          content: selectedPrompt.content,
                          timestamp: new Date(),
                        },
                      ]
                    : [],
                  error: undefined,
                }
              : instance
          );
        }
      });
    },
    [onClearConversation, selectedPrompt]
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">
              {selectedPrompt ? selectedPrompt.name : "Prompt Playground"}
            </h1>
            {selectedTools && selectedTools.length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                <span>
                  {selectedTools.length} tool
                  {selectedTools.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {chatInstances.length > 1 && (
                <label className="text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={syncSettings}
                    onChange={(e) => setSyncSettings(e.target.checked)}
                    className="mr-1"
                  />
                  Synced
                </label>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={addChatPanel}
              className="flex items-center gap-1"
            >
              <Plus size={14} />
              Add Model
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenSettings}
              title="Settings"
            >
              <Settings size={18} />
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Panels Grid */}
      <div className={`flex-1 grid ${gridCols} gap-4 p-4 overflow-hidden`}>
        {chatInstances.map((instance, index) => (
          <ChatPanel
            key={instance.id}
            id={instance.id}
            messages={instance.messages}
            config={instance.config}
            selectedPrompt={selectedPrompt}
            selectedTools={selectedTools}
            isLoading={instance.isLoading}
            error={instance.error}
            isSynced={syncSettings && chatInstances.length > 1}
            canRemove={chatInstances.length > 1}
            onSendMessage={handleSendMessage}
            onModelChange={handleModelChange}
            onConfigChange={handleConfigChange}
            onRemovePanel={removeChatPanel}
            onClearMessages={handleClearMessages}
            sharedInput={syncSettings ? input || sharedInput : undefined}
            onSharedInputChange={
              syncSettings ? handleSharedInputChange : undefined
            }
            onSharedSubmit={syncSettings ? handleSharedSubmit : undefined}
            // Pass AI SDK functions for the first panel
            isFirstPanel={index === 0}
            aiInputChange={index === 0 ? handleInputChange : undefined}
            aiSubmit={index === 0 ? handleSubmit : undefined}
            aiInput={index === 0 ? input : undefined}
          />
        ))}
      </div>
    </div>
  );
};
