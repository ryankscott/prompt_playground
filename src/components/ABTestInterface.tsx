import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  User,
  Bot,
  AlertCircle,
  Clock,
  Zap,
  DollarSign,
  Settings2,
  Split,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type {
  Message,
  LLMConfig,
  Prompt,
  MessageMetadata,
  LLMProvider,
} from "../types";
import { MODELS, getProviderForModel } from "../types";
import { Button } from "./ui/button";
import { createApiCall, storage } from "../utils";

interface ABTestResult {
  messages: Message[];
  isLoading: boolean;
  error?: string;
}

interface ABTestInterfaceProps {
  selectedPrompt?: Prompt | null;
  onOpenSettings: () => void;
  config: LLMConfig;
}

export const ABTestInterface: React.FC<ABTestInterfaceProps> = ({
  selectedPrompt,
  onOpenSettings,
  config,
}) => {
  const [input, setInput] = useState("");
  const [leftConfig, setLeftConfig] = useState<LLMConfig>(config);

  // Initialize rightConfig with proper API key for the different provider
  const [rightConfig, setRightConfig] = useState<LLMConfig>(() => {
    const providerConfigs = storage.getProviderConfigs();
    const currentProvider = getProviderForModel(config.model);
    const rightProvider = currentProvider === "openai" ? "anthropic" : "openai";
    const rightModel =
      currentProvider === "openai" ? "claude-sonnet-4-20250514" : "gpt-4o-mini";
    const rightProviderConfig = providerConfigs[rightProvider];

    return {
      ...config,
      model: rightModel,
      apiKey: rightProviderConfig?.apiKey,
      baseUrl: rightProviderConfig?.baseUrl,
    };
  });

  const [leftResult, setLeftResult] = useState<ABTestResult>({
    messages: [],
    isLoading: false,
  });

  const [rightResult, setRightResult] = useState<ABTestResult>({
    messages: [],
    isLoading: false,
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const leftMessagesEndRef = useRef<HTMLDivElement>(null);
  const rightMessagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Use setTimeout to ensure DOM has updated before scrolling
    const timer = setTimeout(() => {
      leftMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      rightMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    return () => clearTimeout(timer);
  }, [leftResult.messages, rightResult.messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || leftResult.isLoading || rightResult.isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    // Add system message if prompt is selected
    const getMessagesWithPrompt = () => {
      const messages = [];
      if (selectedPrompt) {
        messages.push({
          id: crypto.randomUUID(),
          role: "system" as const,
          content: selectedPrompt.content,
          timestamp: new Date(),
        });
      }
      messages.push(userMessage);
      return messages;
    };

    const messagesToSend = getMessagesWithPrompt();

    // Update both sides with user message
    setLeftResult((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: undefined,
    }));

    setRightResult((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: undefined,
    }));

    setInput("");

    // Create placeholder assistant messages
    const leftAssistantId = crypto.randomUUID();
    const rightAssistantId = crypto.randomUUID();

    const createPlaceholderMessage = (id: string): Message => ({
      id,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    });

    setLeftResult((prev) => ({
      ...prev,
      messages: [...prev.messages, createPlaceholderMessage(leftAssistantId)],
    }));

    setRightResult((prev) => ({
      ...prev,
      messages: [...prev.messages, createPlaceholderMessage(rightAssistantId)],
    }));

    // Call both APIs simultaneously
    const callLeftAPI = async () => {
      try {
        const onChunk = (chunk: string) => {
          setLeftResult((prev) => ({
            ...prev,
            messages: prev.messages.map((msg) =>
              msg.id === leftAssistantId
                ? { ...msg, content: msg.content + chunk }
                : msg
            ),
          }));
        };

        const result = await createApiCall(messagesToSend, leftConfig, onChunk);

        setLeftResult((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === leftAssistantId
              ? { ...msg, content: result.content, metadata: result.metadata }
              : msg
          ),
          isLoading: false,
        }));
      } catch (error) {
        setLeftResult((prev) => ({
          ...prev,
          messages: prev.messages.filter((msg) => msg.id !== leftAssistantId),
          isLoading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }));
      }
    };

    const callRightAPI = async () => {
      try {
        const onChunk = (chunk: string) => {
          setRightResult((prev) => ({
            ...prev,
            messages: prev.messages.map((msg) =>
              msg.id === rightAssistantId
                ? { ...msg, content: msg.content + chunk }
                : msg
            ),
          }));
        };

        const result = await createApiCall(
          messagesToSend,
          rightConfig,
          onChunk
        );

        setRightResult((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === rightAssistantId
              ? { ...msg, content: result.content, metadata: result.metadata }
              : msg
          ),
          isLoading: false,
        }));
      } catch (error) {
        setRightResult((prev) => ({
          ...prev,
          messages: prev.messages.filter((msg) => msg.id !== rightAssistantId),
          isLoading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        }));
      }
    };

    // Execute both API calls in parallel
    await Promise.all([callLeftAPI(), callRightAPI()]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  const updateModelConfig = (
    side: "left" | "right",
    provider: LLMProvider,
    model: string
  ) => {
    const updateConfig = side === "left" ? setLeftConfig : setRightConfig;
    const providerConfigs = storage.getProviderConfigs();
    const providerConfig = providerConfigs[provider];

    updateConfig((prev) => ({
      ...prev,
      model,
      apiKey: providerConfig?.apiKey,
      baseUrl: providerConfig?.baseUrl,
    }));
  };

  const clearResults = () => {
    setLeftResult({ messages: [], isLoading: false });
    setRightResult({ messages: [], isLoading: false });
  };

  const renderMessageMetadata = (metadata?: MessageMetadata) => {
    if (!metadata) return null;

    const { tokenUsage, timeTaken, cost } = metadata;

    return (
      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 border-t border-gray-100 pt-2">
        {tokenUsage && (
          <div className="flex items-center gap-1">
            <Zap size={12} />
            <span>
              {tokenUsage.inputTokens.toLocaleString()} in •{" "}
              {tokenUsage.outputTokens.toLocaleString()} out •{" "}
              {tokenUsage.totalTokens.toLocaleString()} total
            </span>
          </div>
        )}
        {timeTaken && (
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>{(timeTaken / 1000).toFixed(2)}s</span>
          </div>
        )}
        {cost !== undefined && cost > 0 && (
          <div className="flex items-center gap-1">
            <DollarSign size={12} />
            <span>${cost.toFixed(6)}</span>
          </div>
        )}
      </div>
    );
  };

  const renderMessage = (message: Message, config: LLMConfig) => {
    const isUser = message.role === "user";
    const isSystem = message.role === "system";

    return (
      <div
        key={message.id}
        className={`flex gap-3 p-4 ${
          isUser ? "bg-blue-50" : isSystem ? "bg-yellow-50" : "bg-white"
        } border-b border-gray-100`}
      >
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? "bg-blue-600" : isSystem ? "bg-yellow-600" : "bg-gray-600"
          }`}
        >
          {isUser ? (
            <User size={16} className="text-white" />
          ) : isSystem ? (
            <AlertCircle size={16} className="text-white" />
          ) : (
            <Bot size={16} className="text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-900">
              {isUser ? "You" : isSystem ? "System" : config.model}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
          {message.role === "assistant" &&
            renderMessageMetadata(message.metadata)}
        </div>
      </div>
    );
  };

  const renderModelSelector = (
    side: "left" | "right",
    currentConfig: LLMConfig,
    title: string
  ) => {
    const currentProvider = getProviderForModel(currentConfig.model);

    return (
      <div className="p-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        </div>
        <div className="flex gap-2">
          <select
            value={currentProvider || ""}
            onChange={(e) => {
              const provider = e.target.value as LLMProvider;
              const firstModel = MODELS[provider]?.[0]?.id || "";
              updateModelConfig(side, provider, firstModel);
            }}
            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {Object.keys(MODELS).map((provider) => (
              <option key={provider} value={provider}>
                {provider.charAt(0).toUpperCase() + provider.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={currentConfig.model}
            onChange={(e) => {
              const provider = getProviderForModel(e.target.value);
              if (provider) {
                updateModelConfig(side, provider, e.target.value);
              }
            }}
            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {currentProvider &&
              MODELS[currentProvider]?.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
          </select>
        </div>
      </div>
    );
  };

  const renderMessages = (
    result: ABTestResult,
    config: LLMConfig,
    messagesEndRef: React.RefObject<HTMLDivElement | null>
  ) => {
    return (
      <div className="flex-1 overflow-y-auto min-h-0">
        {result.messages.filter((msg) => msg.role !== "system").length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <Split className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">Send a message to compare responses</p>
            </div>
          </div>
        ) : (
          <div className="h-full">
            {result.messages
              .filter((msg) => msg.role !== "system")
              .map((message) => renderMessage(message, config))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">A/B Test</h1>
            <p className="text-sm text-gray-500">
              Compare responses from different models
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={clearResults}
              disabled={leftResult.isLoading || rightResult.isLoading}
            >
              Clear Results
            </Button>
            <button
              onClick={onOpenSettings}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings2 size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Split View */}
      <div className="flex-1 flex min-h-0">
        {/* Left Side */}
        <div className="flex-1 flex flex-col border-r border-gray-200 min-h-0">
          {renderModelSelector("left", leftConfig, "Model A")}
          {renderMessages(leftResult, leftConfig, leftMessagesEndRef)}
          {leftResult.error && (
            <div className="border-t border-red-200 bg-red-50 p-2 flex-shrink-0">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle size={14} />
                <span className="text-xs">{leftResult.error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Side */}
        <div className="flex-1 flex flex-col min-h-0">
          {renderModelSelector("right", rightConfig, "Model B")}
          {renderMessages(rightResult, rightConfig, rightMessagesEndRef)}
          {rightResult.error && (
            <div className="border-t border-red-200 bg-red-50 p-2 flex-shrink-0">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle size={14} />
                <span className="text-xs">{rightResult.error}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4 flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message to compare responses..."
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ minHeight: "48px", maxHeight: "120px" }}
              disabled={leftResult.isLoading || rightResult.isLoading}
            />
          </div>
          <Button
            size="lg"
            type="submit"
            disabled={
              !input.trim() || leftResult.isLoading || rightResult.isLoading
            }
            className="mb-2"
          >
            <Send size={18} />
          </Button>
        </form>
        <div className="mt-2 text-xs text-gray-500">
          Press Enter to send to both models, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};
