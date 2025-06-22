import React from "react";
import type { Model } from "./types";
import { OpenAIIcon, AnthropicIcon, GoogleIcon, OllamaIcon } from "./icons";
// Provider-specific types
export interface LLMProvider {
  id: string;
  name: string;
  icon: React.ComponentType; // React component for the provider icon
  configFields: Array<{
    id: string;
    name: string;
    type: "text" | "password";
    required: boolean;
  }>;
}

// Define LLM Providers
export const PROVIDERS: Record<string, LLMProvider> = {
  openai: {
    id: "openai",
    name: "OpenAI",
    icon: OpenAIIcon,
    configFields: [
      {
        id: "apiKey",
        name: "API Key",
        type: "password",
        required: true,
      },
    ],
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic",
    icon: AnthropicIcon,
    configFields: [
      {
        id: "apiKey",
        name: "API Key",
        type: "password",
        required: true,
      },
    ],
  },
  google: {
    id: "google",
    name: "Google",
    icon: GoogleIcon,
    configFields: [
      {
        id: "apiKey",
        name: "API Key",
        type: "password",
        required: true,
      },
    ],
  },
  ollama: {
    id: "ollama",
    name: "Ollama",
    icon: OllamaIcon,
    configFields: [
      {
        id: "baseUrl",
        name: "Base URL",
        type: "text",
        required: true,
      },
    ],
  },
};

export interface ProviderConfig {
  providerId: string;
  apiKey?: string;
  baseUrl?: string;
  organizationId?: string;
}

// Define model groups with their associated providers
export const MODELS: Record<string, Model[]> = {
  openai: [
    {
      id: "gpt-4.1-nano",
      name: "GPT-4.1 Nano",
      provider: PROVIDERS.openai,
      supportsTools: true,
      cost: { input: 0.01, output: 0.03 },
    },
    {
      id: "gpt-4.1-mini",
      name: "GPT-4.1 Mini",
      provider: PROVIDERS.openai,
      supportsTools: true,
      cost: { input: 0.01, output: 0.03 },
    },
    {
      id: "gpt-4o-mini",
      name: "GPT-4o Mini",
      provider: PROVIDERS.openai,
      supportsTools: true,
      cost: { input: 0.005, output: 0.015 },
    },
    {
      id: "gpt-4.1",
      name: "GPT-4.1",
      provider: PROVIDERS.openai,
      supportsTools: true,
      cost: { input: 0.01, output: 0.03 },
    },
  ],
  anthropic: [
    {
      id: "claude-4-opus",
      name: "Claude 4 Opus",
      provider: PROVIDERS.anthropic,
      supportsTools: true,
      cost: { input: 0.015, output: 0.075 },
    },
    {
      id: "claude-4-sonnet",
      name: "Claude 4 Sonnet",
      provider: PROVIDERS.anthropic,
      supportsTools: true,
      cost: { input: 0.003, output: 0.015 },
    },
    {
      id: "claude-3.7-sonnet",
      name: "Claude 3.7 Sonnet",
      provider: PROVIDERS.anthropic,
      supportsTools: true,
      cost: { input: 0.00025, output: 0.00125 },
    },
  ],
  google: [
    {
      id: "gemini-2.5-flash-lite",
      name: "Gemini 2.5 Flash Lite",
      provider: PROVIDERS.google,
      supportsTools: true,
      cost: { input: 0.000125, output: 0.000375 },
    },
    {
      id: "gemini-2.5-pro",
      name: "Gemini 2.5 Pro",
      provider: PROVIDERS.google,
      supportsTools: true,
      cost: { input: 0.00035, output: 0.00105 },
    },
    {
      id: "gemini-2.5-flash",
      name: "Gemini 2.5 Flash",
      provider: PROVIDERS.google,
      supportsTools: true,
      cost: { input: 0.000175, output: 0.000525 },
    },
  ],
  ollama: [
    {
      id: "llama3.2",
      name: "Llama 3.2 (4B)",
      provider: PROVIDERS.ollama,
      supportsTools: true,
      cost: { input: 0, output: 0 },
    },
    {
      id: "gemma3:4b",
      name: "Gemma 3 (4B)",
      provider: PROVIDERS.ollama,
      supportsTools: false,
      cost: { input: 0, output: 0 },
    },
    {
      id: "deepseek-r1:8b",
      name: "Deepseek R1 (8B)",
      provider: PROVIDERS.ollama,
      supportsTools: false,
      cost: { input: 0, output: 0 },
    },
  ],
};

// Function to get all available models flattened into a single array
export const getAllModels = (): Model[] => {
  return Object.values(MODELS).flat();
};

// Function to get the provider for a given model ID
export const getProviderForModel = (
  modelId: string
): LLMProvider | undefined => {
  for (const models of Object.values(MODELS)) {
    const model = models.find((m) => m.id === modelId);
    if (model) return model.provider;
  }

  // Fallback logic - check by model ID prefix
  if (modelId.startsWith("gpt-")) return PROVIDERS.openai;
  if (modelId.startsWith("claude-")) return PROVIDERS.anthropic;
  if (modelId.startsWith("gemini-")) return PROVIDERS.google;

  // Ollama models can have various prefixes
  if (
    modelId === "llama3.2:latest" ||
    modelId === "gemma3:4b" ||
    modelId === "deepseek-r1:8b"
  )
    return PROVIDERS.ollama;

  return undefined;
};

// Function to get the provider ID as a string for a given model ID (for backward compatibility)
export const getProviderIdForModel = (modelId: string): string | undefined => {
  const provider = getProviderForModel(modelId);
  return provider?.id;
};

// Function to get model info for a model ID
export const getModelInfo = (modelId: string): Model | undefined => {
  for (const models of Object.values(MODELS)) {
    const model = models.find((m) => m.id === modelId);
    if (model) return model;
  }

  return undefined;
};
