import type {
  Prompt,
  LLMConfig,
  Message,
  TokenUsage,
  ProviderConfig,
  LLMProvider,
} from "./types";
import { MODELS, getProviderForModel } from "./types";

const PROMPTS_KEY = "playground_prompts";
const CONFIG_KEY = "playground_config";
const PROVIDER_CONFIGS_KEY = "playground_provider_configs";

export const calculateCost = (
  tokenUsage: TokenUsage,
  modelId: string
): number => {
  const provider = getProviderForModel(modelId);
  if (!provider) {
    console.warn(`Provider not found for model ${modelId}`);
    return 0;
  }

  const providerModels = MODELS[provider];
  const model = providerModels.find((m) => m.id === modelId);

  if (!model) {
    console.warn(
      `Model ${modelId} not found for provider ${provider}, using default rates`
    );
    // Fallback to first model's rates for the provider
    const fallbackModel = providerModels[0];
    if (!fallbackModel) return 0;
    const rates = fallbackModel.cost;
    const inputCost = (tokenUsage.inputTokens / 1000000) * rates.input;
    const outputCost = (tokenUsage.outputTokens / 1000000) * rates.output;
    return inputCost + outputCost;
  }

  const rates = model.cost;
  const inputCost = (tokenUsage.inputTokens / 1000000) * rates.input;
  const outputCost = (tokenUsage.outputTokens / 1000000) * rates.output;
  return inputCost + outputCost;
};

export const storage = {
  getPrompts: (): Prompt[] => {
    try {
      const stored = localStorage.getItem(PROMPTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  savePrompts: (prompts: Prompt[]): void => {
    localStorage.setItem(PROMPTS_KEY, JSON.stringify(prompts));
  },

  getConfig: (): Partial<LLMConfig> => {
    try {
      const stored = localStorage.getItem(CONFIG_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  },

  saveConfig: (config: Partial<LLMConfig>): void => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  },

  getProviderConfigs: (): Record<
    string,
    { apiKey?: string; baseUrl?: string }
  > => {
    try {
      const stored = localStorage.getItem(PROVIDER_CONFIGS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  },

  saveProviderConfigs: (
    configs: Record<string, { apiKey?: string; baseUrl?: string }>
  ): void => {
    localStorage.setItem(PROVIDER_CONFIGS_KEY, JSON.stringify(configs));
  },

  exportPrompts: (prompts: Prompt[]): void => {
    const dataStr = JSON.stringify(prompts, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(dataBlob);
    link.download = `prompts-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  },

  importPrompts: (): Promise<Prompt[]> => {
    return new Promise((resolve, reject) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";

      input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) {
          reject(new Error("No file selected"));
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            const prompts = JSON.parse(content) as Prompt[];

            // Validate the structure
            if (!Array.isArray(prompts)) {
              throw new Error(
                "Invalid file format: Expected an array of prompts"
              );
            }

            // Validate each prompt has required fields
            const isValidPrompt = (prompt: unknown): prompt is Prompt => {
              if (!prompt || typeof prompt !== "object" || prompt === null)
                return false;
              const p = prompt as Record<string, unknown>;
              return (
                typeof p.id === "string" &&
                typeof p.name === "string" &&
                typeof p.content === "string" &&
                p.createdAt !== undefined &&
                p.updatedAt !== undefined
              );
            };

            if (!prompts.every(isValidPrompt)) {
              throw new Error(
                "Invalid file format: Some prompts are missing required fields"
              );
            }

            // Convert date strings back to Date objects
            const processedPrompts = prompts.map((prompt) => ({
              ...prompt,
              createdAt: new Date(prompt.createdAt),
              updatedAt: new Date(prompt.updatedAt),
            }));

            resolve(processedPrompts);
          } catch (error) {
            reject(
              new Error(
                `Failed to parse file: ${
                  error instanceof Error ? error.message : "Unknown error"
                }`
              )
            );
          }
        };

        reader.onerror = () => {
          reject(new Error("Failed to read file"));
        };

        reader.readAsText(file);
      };

      input.click();
    });
  },
};

export const createApiCall = async (
  messages: Message[],
  config: LLMConfig,
  onChunk?: (chunk: string) => void
): Promise<{
  content: string;
  metadata: { tokenUsage?: TokenUsage; timeTaken: number; cost?: number };
}> => {
  const startTime = Date.now();
  const provider = getProviderForModel(config.model);

  if (!provider) {
    throw new Error(`Unknown provider for model: ${config.model}`);
  }

  let result: { content: string; tokenUsage?: TokenUsage };

  switch (provider) {
    case "openai":
      result = await callOpenAI(messages, config, onChunk);
      break;
    case "anthropic":
      result = await callAnthropic(messages, config, onChunk);
      break;
    case "google":
      result = await callGoogle(messages, config, onChunk);
      break;
    case "ollama":
      result = await callOllama(messages, config, onChunk);
      break;
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }

  const timeTaken = Date.now() - startTime;
  const cost = result.tokenUsage
    ? calculateCost(result.tokenUsage, config.model)
    : undefined;

  return {
    content: result.content,
    metadata: {
      tokenUsage: result.tokenUsage,
      timeTaken,
      cost,
    },
  };
};

const callOpenAI = async (
  messages: Message[],
  config: LLMConfig,
  onChunk?: (chunk: string) => void
): Promise<{ content: string; tokenUsage?: TokenUsage }> => {
  if (!config.apiKey) {
    throw new Error("OpenAI API key is required");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      stream: !!onChunk,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `OpenAI API error: ${error.error?.message || "Unknown error"}`
    );
  }

  if (onChunk && response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                onChunk(content);
              }
            } catch {
              // Skip invalid JSON lines
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return {
      content: fullContent || "No response received",
      // Note: Token usage not available in streaming mode for OpenAI
    };
  } else {
    const data = await response.json();
    const content = data.choices[0]?.message?.content || "No response received";
    const usage = data.usage;

    const tokenUsage: TokenUsage | undefined = usage
      ? {
          inputTokens: usage.prompt_tokens || 0,
          outputTokens: usage.completion_tokens || 0,
          totalTokens: usage.total_tokens || 0,
        }
      : undefined;

    return { content, tokenUsage };
  }
};

const callAnthropic = async (
  messages: Message[],
  config: LLMConfig,
  onChunk?: (chunk: string) => void
): Promise<{ content: string; tokenUsage?: TokenUsage }> => {
  if (!config.apiKey) {
    throw new Error("Anthropic API key is required");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      stream: !!onChunk,
      messages: messages
        .filter((msg) => msg.role !== "system")
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      system: messages.find((msg) => msg.role === "system")?.content,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Anthropic API error: ${error.error?.message || "Unknown error"}`
    );
  }

  if (onChunk && response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "content_block_delta") {
                const content = parsed.delta?.text;
                if (content) {
                  fullContent += content;
                  onChunk(content);
                }
              }
            } catch {
              // Skip invalid JSON lines
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return {
      content: fullContent || "No response received",
      // Note: Token usage not available in streaming mode for Anthropic
    };
  } else {
    const data = await response.json();
    const content = data.content[0]?.text || "No response received";
    const usage = data.usage;

    const tokenUsage: TokenUsage | undefined = usage
      ? {
          inputTokens: usage.input_tokens || 0,
          outputTokens: usage.output_tokens || 0,
          totalTokens: (usage.input_tokens || 0) + (usage.output_tokens || 0),
        }
      : undefined;

    return { content, tokenUsage };
  }
};

const callGoogle = async (
  messages: Message[],
  config: LLMConfig,
  onChunk?: (chunk: string) => void
): Promise<{ content: string; tokenUsage?: TokenUsage }> => {
  if (!config.apiKey) {
    throw new Error("Google API key is required");
  }

  // For Google API, streaming support may vary - implementing basic version
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:streamGenerateContent?key=${config.apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: messages.map((msg) => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        })),
        generationConfig: {
          temperature: config.temperature,
          maxOutputTokens: config.maxTokens,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Google API error: ${error.error?.message || "Unknown error"}`
    );
  }

  if (onChunk && response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.trim()) {
            try {
              const parsed = JSON.parse(line);
              const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (content) {
                fullContent += content;
                onChunk(content);
              }
            } catch {
              // Skip invalid JSON lines
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return {
      content: fullContent || "No response received",
      // Note: Token usage not typically available in streaming mode for Google
    };
  } else {
    // Fallback to non-streaming for Google
    const fallbackResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: messages.map((msg) => ({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }],
          })),
          generationConfig: {
            temperature: config.temperature,
            maxOutputTokens: config.maxTokens,
          },
        }),
      }
    );

    if (!fallbackResponse.ok) {
      const error = await fallbackResponse.json();
      throw new Error(
        `Google API error: ${error.error?.message || "Unknown error"}`
      );
    }

    const data = await fallbackResponse.json();
    const content =
      data.candidates[0]?.content?.parts[0]?.text || "No response received";
    const usage = data.usageMetadata;

    const tokenUsage: TokenUsage | undefined = usage
      ? {
          inputTokens: usage.promptTokenCount || 0,
          outputTokens: usage.candidatesTokenCount || 0,
          totalTokens: usage.totalTokenCount || 0,
        }
      : undefined;

    return { content, tokenUsage };
  }
};

const callOllama = async (
  messages: Message[],
  config: LLMConfig,
  onChunk?: (chunk: string) => void
): Promise<{ content: string; tokenUsage?: TokenUsage }> => {
  const baseUrl = config.baseUrl || "http://localhost:11434";

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      stream: !!onChunk,
      options: {
        temperature: config.temperature,
        num_predict: config.maxTokens,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.statusText}`);
  }

  if (onChunk && response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";
    let tokenUsage: TokenUsage | undefined;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.trim()) {
            try {
              const parsed = JSON.parse(line);
              const content = parsed.message?.content;
              if (content) {
                fullContent += content;
                onChunk(content);
              }

              // Extract token usage from final response
              if (
                parsed.done &&
                parsed.prompt_eval_count &&
                parsed.eval_count
              ) {
                tokenUsage = {
                  inputTokens: parsed.prompt_eval_count,
                  outputTokens: parsed.eval_count,
                  totalTokens: parsed.prompt_eval_count + parsed.eval_count,
                };
              }
            } catch {
              // Skip invalid JSON lines
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return {
      content: fullContent || "No response received",
      tokenUsage,
    };
  } else {
    const data = await response.json();
    const content = data.message?.content || "No response received";

    // Ollama provides token counts in the response
    const tokenUsage: TokenUsage | undefined =
      data.prompt_eval_count && data.eval_count
        ? {
            inputTokens: data.prompt_eval_count,
            outputTokens: data.eval_count,
            totalTokens: data.prompt_eval_count + data.eval_count,
          }
        : undefined;

    return { content, tokenUsage };
  }
};

export const getModelCost = (modelId: string) => {
  const provider = getProviderForModel(modelId);
  if (!provider) {
    return { input: 0, output: 0 };
  }

  const providerModels = MODELS[provider];
  const model = providerModels.find((m) => m.id === modelId);
  return model?.cost || { input: 0, output: 0 };
};
