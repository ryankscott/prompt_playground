import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  User,
  Bot,
  AlertCircle,
  Settings,
  Clock,
  Zap,
  DollarSign,
  RotateCcw,
  MessageSquarePlus,
  Wrench,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import hljs from "highlight.js/lib/core";
import json from "highlight.js/lib/languages/json";
import "highlight.js/styles/github.css";
import type {
  Message,
  LLMConfig,
  Prompt,
  MessageMetadata,
  Tool,
} from "../types";
import { MODELS } from "../types";
import { Button } from "./ui/button";

// Register JSON language for highlight.js
hljs.registerLanguage("json", json);

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  error?: string;
  config: LLMConfig;
  selectedPrompt?: Prompt | null;
  selectedTools?: Tool[];
  onOpenSettings: () => void;
  onClearConversation?: () => void;
  onStartNewConversation?: () => void;
  onModelChange?: (model: string) => void;
  showHeader?: boolean; // Control whether to show the header
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
}) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput("");
    }
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

  const highlightJson = (jsonString: string) => {
    try {
      const highlighted = hljs.highlight(jsonString, { language: "json" });
      return highlighted.value;
    } catch {
      return jsonString; // Fallback to plain text if highlighting fails
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

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

  const renderMessage = (message: Message) => {
    const isUser = message.role === "user";
    const isSystem = message.role === "system";
    const isTool = message.role === "tool";

    return (
      <div
        key={message.id}
        className={`flex gap-3 p-4 ${
          isUser
            ? "bg-blue-50"
            : isSystem
            ? "bg-yellow-50"
            : isTool
            ? "bg-purple-50 border-l-4 border-purple-300"
            : "bg-white"
        } border-b border-gray-100`}
      >
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser
              ? "bg-blue-600"
              : isSystem
              ? "bg-yellow-600"
              : isTool
              ? "bg-purple-600"
              : "bg-gray-600"
          }`}
        >
          {isUser ? (
            <User size={16} className="text-white" />
          ) : isSystem ? (
            <AlertCircle size={16} className="text-white" />
          ) : isTool ? (
            <Wrench size={16} className="text-white" />
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
            {/* Tool usage indicator for assistant messages */}
            {message.role === "assistant" &&
              message.toolCalls &&
              message.toolCalls.length > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                  <Wrench size={10} />
                  <span>
                    Used {message.toolCalls.length} tool
                    {message.toolCalls.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            <span className="text-xs text-gray-500">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
          </div>

          {/* Tool calls display */}
          {message.toolCalls && message.toolCalls.length > 0 && (
            <div className="mb-3 space-y-2">
              <div className="text-xs font-medium text-purple-700 flex items-center gap-1">
                <Wrench size={12} />
                Tool Execution{" "}
                {message.toolCalls.length > 1
                  ? `(${message.toolCalls.length} tools)`
                  : ""}
              </div>
              {message.toolCalls.map((toolCall) => (
                <div
                  key={toolCall.id}
                  className="bg-purple-100 border border-purple-200 p-3 rounded-lg"
                >
                  <div className="text-sm font-medium text-purple-800 flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    Calling:{" "}
                    <code className="bg-purple-200 px-1 py-0.5 rounded text-xs">
                      {toolCall.name}
                    </code>
                  </div>
                  <div className="text-xs text-purple-600">
                    <div className="text-xs font-medium text-purple-700 mb-1">
                      Arguments:
                    </div>
                    <pre
                      className="whitespace-pre-wrap bg-white p-2 rounded border border-purple-200 overflow-x-auto text-xs"
                      dangerouslySetInnerHTML={{
                        __html: highlightJson(
                          JSON.stringify(toolCall.arguments, null, 2)
                        ),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed">
            {isTool ? (
              // Special handling for tool result content
              <div className="space-y-2">
                <div className="text-xs font-medium text-purple-700 uppercase tracking-wide">
                  Tool Response
                </div>
                <div className="bg-white border border-purple-200 rounded p-3">
                  {(() => {
                    try {
                      // Try to parse as JSON for better formatting
                      const parsed = JSON.parse(message.content);
                      return (
                        <pre
                          className="whitespace-pre-wrap text-sm overflow-x-auto"
                          dangerouslySetInnerHTML={{
                            __html: highlightJson(
                              JSON.stringify(parsed, null, 2)
                            ),
                          }}
                        />
                      );
                    } catch {
                      // If not JSON, display as plain text with markdown
                      return (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      );
                    }
                  })()}
                </div>
              </div>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code: (props) => {
                    return (
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">
                        {props.children}
                      </code>
                    );
                  },
                  pre: (props) => (
                    <pre className="bg-gray-100 rounded-md p-3 overflow-x-auto mb-2">
                      {props.children}
                    </pre>
                  ),
                  p: (props) => (
                    <p className="mb-2 last:mb-0">{props.children}</p>
                  ),
                  h1: (props) => (
                    <h1 className="text-xl font-bold mb-2">{props.children}</h1>
                  ),
                  h2: (props) => (
                    <h2 className="text-lg font-bold mb-2">{props.children}</h2>
                  ),
                  h3: (props) => (
                    <h3 className="text-base font-bold mb-1">
                      {props.children}
                    </h3>
                  ),
                  ul: (props) => (
                    <ul className="list-disc pl-6 mb-2">{props.children}</ul>
                  ),
                  ol: (props) => (
                    <ol className="list-decimal pl-6 mb-2">{props.children}</ol>
                  ),
                  li: (props) => <li className="mb-1">{props.children}</li>,
                  blockquote: (props) => (
                    <blockquote className="border-l-4 border-gray-300 pl-4 italic mb-2">
                      {props.children}
                    </blockquote>
                  ),
                  strong: (props) => (
                    <strong className="font-bold">{props.children}</strong>
                  ),
                  em: (props) => <em className="italic">{props.children}</em>,
                  a: (props) => (
                    <a
                      href={props.href}
                      className="text-blue-600 hover:text-blue-800 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {props.children}
                    </a>
                  ),
                  table: (props) => (
                    <table className="border-collapse w-full mb-2">
                      {props.children}
                    </table>
                  ),
                  thead: (props) => (
                    <thead className="bg-gray-50">{props.children}</thead>
                  ),
                  tbody: (props) => <tbody>{props.children}</tbody>,
                  tr: (props) => (
                    <tr className="border-b border-gray-200">
                      {props.children}
                    </tr>
                  ),
                  th: (props) => (
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
                      {props.children}
                    </th>
                  ),
                  td: (props) => (
                    <td className="border border-gray-300 px-3 py-2">
                      {props.children}
                    </td>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
          {message.role === "assistant" &&
            renderMessageMetadata(message.metadata)}
        </div>
      </div>
    );
  };

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
              {/* Model Selector */}
              <div className="flex items-center gap-2">
                <select
                  value={config.model}
                  onChange={(e) => {
                    if (onModelChange) {
                      onModelChange(e.target.value);
                    }
                  }}
                  className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {Object.entries(MODELS).flatMap(([provider, models]) =>
                    models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {provider.charAt(0).toUpperCase() + provider.slice(1)} -{" "}
                        {model.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              {selectedPrompt && onClearConversation && (
                <button
                  onClick={onClearConversation}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Clear conversation (keep prompt)"
                >
                  <RotateCcw size={18} />
                </button>
              )}
              {onStartNewConversation && (
                <button
                  onClick={onStartNewConversation}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Start new conversation (no prompt)"
                >
                  <MessageSquarePlus size={18} />
                </button>
              )}
              <button
                onClick={onOpenSettings}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {messages.filter((msg) => msg.role !== "system").length === 0 ? (
            <div className="flex items-center justify-center h-full mt-8">
              <div className="text-center">
                <Bot size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Start a conversation
                </h3>
                <p className="text-gray-500 mb-4">
                  {selectedPrompt
                    ? `Using "${selectedPrompt.name}" prompt. Type a message below to begin chatting with the AI.`
                    : "Type a message below to begin chatting with the AI, or select a prompt from the sidebar."}
                </p>
                {!selectedPrompt && (
                  <p className="text-xs text-gray-400">
                    💡 Tip: You can chat directly without selecting a prompt for
                    general conversations.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div>
              {messages
                .filter((msg) => msg.role !== "system")
                .map((message) => {
                  // Show thinking indicator for empty assistant messages during loading
                  if (
                    message.role === "assistant" &&
                    message.content === "" &&
                    isLoading
                  ) {
                    return (
                      <div
                        key={message.id}
                        className="flex gap-3 p-4 bg-white border-b border-gray-100"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                          <Bot size={16} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {config.model}
                            </span>
                            <span className="text-xs text-gray-500">
                              thinking...
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return renderMessage(message);
                })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="border-t border-red-200 bg-red-50 p-4">
          <div className="max-w-4xl mx-auto flex items-center gap-2 text-red-800">
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="flex gap-2 justify-end items-end"
          >
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message here... (Shift+Enter for new line)"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ minHeight: "48px", maxHeight: "120px" }}
                disabled={isLoading}
              />
            </div>
            <Button
              size={"lg"}
              type="submit"
              disabled={!input.trim() || isLoading}
              className="mb-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <Send size={18} />
            </Button>
          </form>
          <div className="mt-2 text-xs text-gray-500">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
};
