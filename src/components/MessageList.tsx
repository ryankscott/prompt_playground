import React, { useEffect } from "react";
import { User, Bot, AlertCircle, Clock, Zap, DollarSign } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message, LLMConfig } from "../types";

interface MessageListProps {
  messages: Message[];
  config: LLMConfig;
  isLoading?: boolean;
  messagesEndRef?: React.RefObject<HTMLDivElement | null>;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  config,
  isLoading = false,
  messagesEndRef,
}) => {
  // Auto-scroll to bottom when messages change or loading state changes
  useEffect(() => {
    if (messagesEndRef?.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, messagesEndRef]);
  const renderMessage = (message: Message) => {
    const isUser = message.role === "user";
    const isSystem = message.role === "system";
    const isTool = message.role === "tool";

    return (
      <div key={message.id} className="flex gap-3 p-4 hover:bg-gray-50/50">
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser
              ? "bg-blue-600"
              : isSystem
              ? "bg-yellow-600"
              : isTool
              ? "bg-green-400"
              : "bg-gray-600"
          }`}
        >
          {isUser ? (
            <User size={16} className="text-white" />
          ) : isSystem ? (
            <AlertCircle size={16} className="text-white" />
          ) : isTool ? (
            <span className="text-white text-xs">🔧</span>
          ) : (
            <Bot size={16} className="text-white" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-900">
              {isUser
                ? "You"
                : isSystem
                ? "System"
                : isTool
                ? "Tool Result"
                : config.model}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
            {isTool && message.toolCallId && (
              <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">
                ID: {message.toolCallId.slice(0, 8)}...
              </span>
            )}
          </div>

          {/* Tool calls display */}
          {message.toolCalls && message.toolCalls.length > 0 && (
            <div className="mb-3 space-y-2">
              {message.toolCalls.map((toolCall) => (
                <div
                  key={toolCall.id}
                  className="bg-blue-50 border border-blue-200 rounded-lg p-3"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                      🔧 Tool Call
                    </div>
                    <span className="text-sm font-medium text-blue-900">
                      {toolCall.name}
                    </span>
                  </div>
                  {Object.keys(toolCall.arguments).length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-blue-700 mb-1">
                        Arguments:
                      </div>
                      <pre className="bg-blue-100 rounded p-2 text-xs text-blue-800 overflow-x-auto">
                        {JSON.stringify(toolCall.arguments, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed break-words overflow-wrap-anywhere">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code: ({ className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || "");
                  const language = match ? match[1] : "";

                  return language ? (
                    <pre className="bg-gray-100 rounded-md p-3 overflow-x-auto mb-2">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                  ) : (
                    <code
                      className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Metadata */}
          {message.metadata && (
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              {message.metadata.timeTaken && (
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{message.metadata.timeTaken}ms</span>
                </div>
              )}
              {message.metadata.tokenUsage && (
                <div className="flex items-center gap-1">
                  <Zap size={12} />
                  <span>{message.metadata.tokenUsage.totalTokens} tokens</span>
                </div>
              )}
              {message.metadata.cost && (
                <div className="flex items-center gap-1">
                  <DollarSign size={12} />
                  <span>${message.metadata.cost.toFixed(4)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Determine if we should show loading indicator
  // Only show if loading AND we don't have an assistant message currently streaming
  const shouldShowLoading =
    isLoading &&
    (messages.length === 0 ||
      messages[messages.length - 1]?.role !== "assistant" ||
      !messages[messages.length - 1]?.content);

  return (
    <div className="flex-1 overflow-y-auto min-h-0">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <p>Start a conversation by typing a message below.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {messages.map(renderMessage)}

          {/* Loading indicator */}
          {shouldShowLoading && (
            <div className="flex gap-3 p-4 bg-white border-b border-gray-100">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                <Bot size={16} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {config.model}
                  </span>
                  <span className="text-xs text-gray-500">thinking...</span>
                </div>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};
