import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOllama } from "ollama-ai-provider";
import type { LanguageModelV1 } from "ai";
import { storage } from "./utils";

/**
 * Get AI SDK model instance for a given model ID with provider configuration
 */
export const getAiSdkModel = (modelId: string): LanguageModelV1 => {
  const providerConfigs = storage.getProviderConfigs();

  // OpenAI models
  if (modelId.startsWith("gpt-") || modelId.includes("gpt")) {
    const config = providerConfigs.openai;
    if (!config?.apiKey) {
      throw new Error("OpenAI API key is required");
    }

    const openaiProvider = createOpenAI({
      apiKey: config.apiKey,
    });

    return openaiProvider(modelId);
  }

  // Anthropic models
  if (modelId.startsWith("claude-")) {
    const config = providerConfigs.anthropic;
    if (!config?.apiKey) {
      throw new Error("Anthropic API key is required");
    }

    const anthropicProvider = createAnthropic({
      apiKey: config.apiKey,
    });

    return anthropicProvider(modelId);
  }

  // Google models
  if (modelId.startsWith("gemini-")) {
    const config = providerConfigs.google;
    if (!config?.apiKey) {
      throw new Error("Google API key is required");
    }

    const googleProvider = createGoogleGenerativeAI({
      apiKey: config.apiKey,
    });

    return googleProvider(modelId);
  }

  // Ollama models
  if (
    modelId.includes("llama") ||
    modelId.includes("gemma") ||
    modelId.includes("deepseek")
  ) {
    const config = providerConfigs.ollama;
    const baseUrl = config?.baseUrl || "http://localhost:11434";

    const ollamaProvider = createOllama({
      baseURL: baseUrl,
    });

    return ollamaProvider(modelId);
  }

  throw new Error(`Unsupported model: ${modelId}`);
};
