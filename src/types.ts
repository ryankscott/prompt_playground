// We changed from LanguageModelV1 to string for better compatibility with AI SDK
// import { LanguageModelV1 } from "ai";
import { getProviderIdForModel, LLMProvider } from "./models";

export interface Prompt {
  id: string;
  name: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface MessageMetadata {
  tokenUsage?: TokenUsage;
  timeTaken?: number; // in milliseconds
  cost?: number; // in USD
}

export interface ToolParameter {
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  enum?: string[]; // For string parameters with predefined values
}

// Helper interface for form state when creating/editing tools
export interface ParameterFormData {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  required: boolean;
  enum?: string[];
}

// Grouped props interfaces to reduce component complexity
export interface ChatProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  error?: string;
}

export interface ModelConfigProps {
  config: LLMConfig;
  onModelChange?: (model: string) => void;
  onOpenSettings: () => void;
}

export interface PromptToolProps {
  selectedPrompt?: Prompt | null;
  selectedTools?: Tool[];
  onClearConversation?: () => void;
  onStartNewConversation?: () => void;
}

export interface AiSdkProps {
  input?: string;
  handleInputChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  status?: "submitted" | "streaming" | "ready" | "error";
  reload?: () => Promise<void>;
  stop?: () => void;
}

export interface ToolFunction {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, ToolParameter>;
    required: string[];
  };
}

export interface Tool {
  id: string;
  type: "function";
  function: ToolFunction;
  code: string; // JavaScript code to execute
  emoji?: string; // Emoji to represent the tool (defaults to 🔧 when not provided)
  createdAt: Date;
  updatedAt: Date;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  result: unknown;
  error?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
  toolCalls?: ToolCall[];
  toolCallId?: string; // For tool result messages
}

export interface Conversation {
  id: string;
  messages: Message[];
  promptId?: string;
  toolIds?: string[]; // Selected tools for this conversation
}

export interface LLMConfig {
  model: string; // Model ID - use getModelInfo() to get full Model details
  temperature: number;
  maxTokens: number;
}

// Internal config type used for API calls that includes provider-specific fields
export interface InternalLLMConfig extends LLMConfig {
  apiKey?: string;
  baseUrl?: string;
}

export interface MultiProviderConfig {
  providers: LLMConfig[];
  temperature: number;
  maxTokens: number;
}

export interface Model {
  id: string;
  name: string;
  provider: LLMProvider; // Reference to LLMProvider instance
  supportsTools: boolean; // Whether the model supports tool/function calling
  cost: {
    input: number; // Cost per 1 million input tokens
    output: number; // Cost per 1 million output tokens
  };
}

// Helper function to check if a model is complete (has all prerequisites)
export const isModelComplete = (
  modelId: string,
  providerConfig: { apiKey?: string; baseUrl?: string }
): boolean => {
  const providerId = getProviderIdForModel(modelId);
  if (providerId === "ollama") {
    return !!providerConfig.baseUrl;
  } else {
    return !!providerConfig.apiKey;
  }
};

// Import model definitions from models.ts
export * from "./models";
