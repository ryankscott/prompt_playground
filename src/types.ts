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

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
}

export interface Conversation {
  id: string;
  messages: Message[];
  promptId?: string;
}

export type LLMProvider = "openai" | "anthropic" | "google" | "ollama";

export interface LLMConfig {
  model: string;
  apiKey?: string;
  baseUrl?: string; // For Ollama
  temperature: number;
  maxTokens: number;
}

export interface ProviderConfig {
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface MultiProviderConfig {
  providers: Record<LLMProvider, ProviderConfig>;
  temperature: number;
  maxTokens: number;
}

export interface Model {
  id: string;
  name: string;
  provider: LLMProvider;
  supportsTools: boolean; // Whether the model supports tool/function calling
  cost: {
    input: number; // Cost per 1 million input tokens
    output: number; // Cost per 1 million output tokens
  };
}

export const MODELS: Record<LLMProvider, Model[]> = {
  openai: [
    {
      id: "gpt-4o-mini",
      name: "GPT-4o Mini",
      provider: "openai",
      supportsTools: true,
      cost: { input: 0.15, output: 0.6 },
    },
    {
      id: "gpt-4.1-mini",
      name: "GPT-4.1 Mini",
      provider: "openai",
      supportsTools: true,
      cost: { input: 0.4, output: 1.6 },
    },
    {
      id: "gpt-4.1-nano",
      name: "GPT-4.1 Nano",
      provider: "openai",
      supportsTools: true,
      cost: { input: 0.1, output: 0.025 },
    },
    {
      id: "gpt-4.1",
      name: "GPT-4.1",
      provider: "openai",
      supportsTools: true,
      cost: { input: 2.0, output: 0.5 },
    },
  ],
  anthropic: [
    {
      id: "claude-sonnet-4-20250514",
      name: "Claude Sonnet 4",
      provider: "anthropic",
      supportsTools: true,
      cost: { input: 3, output: 15 },
    },
    {
      id: "claude-3-7-sonnet-20250219",
      name: "Claude 3.7 Sonnet",
      provider: "anthropic",
      supportsTools: true,
      cost: { input: 0.3, output: 15 },
    },
    {
      id: "claude-3-5-haiku-20241022",
      name: "Claude 3.5 Haiku",
      provider: "anthropic",
      supportsTools: true,
      cost: { input: 0.08, output: 4 },
    },
  ],
  google: [
    {
      id: "gemini-2.0-flash",
      name: "Gemini 2.0 Flash",
      provider: "google",
      supportsTools: true,
      cost: { input: 0.1, output: 0.4 },
    },
    {
      id: "gemini-2.5-flash",
      name: "Gemini 2.5 Flash",
      provider: "google",
      supportsTools: true,
      cost: { input: 0.15, output: 0.6 },
    },
  ],
  ollama: [
    {
      id: "llama3.2",
      name: "Llama 3.2",
      provider: "ollama",
      supportsTools: false,
      cost: { input: 0, output: 0 },
    },
    {
      id: "gemma3",
      name: "Gemma 3",
      provider: "ollama",
      supportsTools: true,
      cost: { input: 0, output: 0 },
    },
  ],
};

// Helper function to get provider for a given model
export const getProviderForModel = (modelId: string): LLMProvider | null => {
  for (const [provider, models] of Object.entries(MODELS)) {
    if (models.some((model) => model.id === modelId)) {
      return provider as LLMProvider;
    }
  }
  return null;
};

// Helper function to get model info
export const getModelInfo = (modelId: string): Model | null => {
  for (const models of Object.values(MODELS)) {
    const model = models.find((m) => m.id === modelId);
    if (model) return model;
  }
  return null;
};

// Helper function to check if a model is complete (has all prerequisites)
export const isModelComplete = (
  modelId: string,
  config: { apiKey?: string; baseUrl?: string }
): boolean => {
  const provider = getProviderForModel(modelId);
  if (!provider) return false;

  if (provider === "ollama") {
    return !!config.baseUrl;
  } else {
    return !!config.apiKey;
  }
};
