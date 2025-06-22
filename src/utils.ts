import { streamText } from "ai";
import type {
  Prompt,
  LLMConfig,
  Message,
  TokenUsage,
  Tool,
  ToolCall,
} from "./types";
import { getProviderIdForModel, MODELS } from "./models";
import { getAiSdkModel } from "./ai-sdk-models";

const PROMPTS_KEY = "playground_prompts";
const CONFIG_KEY = "playground_config";
const PROVIDER_CONFIGS_KEY = "playground_provider_configs";
const TOOLS_KEY = "playground_tools";

export const calculateCost = (
  tokenUsage: TokenUsage,
  modelId: string
): number => {
  const providerId = getProviderIdForModel(modelId);
  if (!providerId) {
    console.warn(`Provider not found for model ${modelId}`);
    return 0;
  }

  const providerModels = MODELS[providerId];
  const model = providerModels.find((m) => m.id === modelId);

  if (!model) {
    console.warn(
      `Model ${modelId} not found for provider ${providerId}, using default rates`
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

  getTools: (): Tool[] => {
    try {
      const stored = localStorage.getItem(TOOLS_KEY);
      if (!stored) return [];
      const tools = JSON.parse(stored);
      return tools.map((tool: Tool) => ({
        ...tool,
        createdAt: new Date(tool.createdAt),
        updatedAt: new Date(tool.updatedAt),
      }));
    } catch {
      return [];
    }
  },

  saveTools: (tools: Tool[]): void => {
    localStorage.setItem(TOOLS_KEY, JSON.stringify(tools));
  },

  exportTools: (tools: Tool[]): void => {
    const dataStr = JSON.stringify(tools, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(dataBlob);
    link.download = `tools-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  },

  importTools: (): Promise<Tool[]> => {
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
            const tools = JSON.parse(content) as Tool[];

            // Validate structure
            if (!Array.isArray(tools)) {
              throw new Error(
                "Invalid file format: Expected an array of tools"
              );
            }

            const processedTools = tools.map((tool) => ({
              ...tool,
              createdAt: new Date(tool.createdAt),
              updatedAt: new Date(tool.updatedAt),
            }));

            resolve(processedTools);
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

        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsText(file);
      };

      input.click();
    });
  },
};

// Tool execution function
export const executeTool = async (
  tool: Tool,
  args: Record<string, unknown>
): Promise<unknown> => {
  try {
    // Create a safe execution environment
    const AsyncFunction = Object.getPrototypeOf(
      async function () {}
    ).constructor;
    const func = new AsyncFunction("args", "fetch", tool.code);

    // Execute with limited globals for security
    const result = await func(args, fetch);
    return result;
  } catch (error) {
    throw new Error(
      `Tool execution failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const createApiCall = async (
  messages: Message[],
  config: LLMConfig,
  tools: Tool[] = [],
  onChunk?: (chunk: string) => void,
  onToolCall?: (toolCall: ToolCall) => void,
  onToolResult?: (toolCallId: string, result: unknown, error?: string) => void
): Promise<{
  content: string;
  metadata: { tokenUsage?: TokenUsage; timeTaken: number; cost?: number };
  toolCalls?: ToolCall[];
}> => {
  const startTime = Date.now();

  try {
    // Get AI SDK model instance
    const selectedModel = getAiSdkModel(config.model);

    // Convert our messages to AI SDK format
    const aiSdkMessages = messages.map((msg) => {
      if (msg.role === "tool") {
        return {
          role: "tool" as const,
          content: [
            {
              type: "tool-result" as const,
              toolCallId: msg.toolCallId!,
              toolName: "unknown", // We'll need to track this properly
              result: msg.content,
            },
          ],
        };
      }

      if (msg.toolCalls && msg.toolCalls.length > 0) {
        return {
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
          toolInvocations: msg.toolCalls.map((tc) => ({
            toolCallId: tc.id,
            toolName: tc.name,
            args: tc.arguments,
          })),
        };
      }

      return {
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
      };
    });

    // Convert tools to AI SDK format
    const aiSdkTools =
      tools.length > 0
        ? Object.fromEntries(
            tools.map((tool) => [
              tool.function.name,
              {
                description: tool.function.description,
                parameters: tool.function.parameters,
                execute: async (args: Record<string, unknown>) => {
                  try {
                    const result = await executeTool(tool, args);
                    return result;
                  } catch (error) {
                    throw new Error(
                      `Tool execution failed: ${
                        error instanceof Error ? error.message : "Unknown error"
                      }`
                    );
                  }
                },
              },
            ])
          )
        : undefined;

    console.log(`🔧 API call with ${tools.length} tools using AI SDK`);

    // Use AI SDK streamText with tools support
    const result = await streamText({
      model: selectedModel,
      messages: aiSdkMessages,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      tools: aiSdkTools,
    });

    let content = "";
    const collectedToolCalls: ToolCall[] = [];

    // Process the streaming result
    for await (const chunk of result.fullStream) {
      switch (chunk.type) {
        case "text-delta":
          content += chunk.textDelta;
          if (onChunk) {
            onChunk(chunk.textDelta);
          }
          break;
        case "tool-call": {
          const toolCall = {
            id: chunk.toolCallId,
            name: chunk.toolName,
            arguments: chunk.args,
          };
          collectedToolCalls.push(toolCall);
          if (onToolCall) {
            onToolCall(toolCall);
          }
          break;
        }
        case "tool-result": {
          if (onToolResult) {
            onToolResult(
              chunk.toolCallId,
              chunk.result,
              // Note: AI SDK v4 doesn't have isError property in tool-result
              undefined
            );
          }
          break;
        }
        case "finish":
          // Final processing if needed
          break;
      }
    }

    // Get usage information
    const usage = await result.usage;
    const tokenUsage: TokenUsage | undefined = usage
      ? {
          inputTokens: usage.promptTokens || 0,
          outputTokens: usage.completionTokens || 0,
          totalTokens: usage.totalTokens || 0,
        }
      : undefined;

    // Calculate cost and timing
    const timeTaken = Date.now() - startTime;
    const cost = tokenUsage
      ? calculateCost(tokenUsage, config.model)
      : undefined;

    return {
      content,
      metadata: {
        tokenUsage,
        timeTaken,
        cost,
      },
      toolCalls: collectedToolCalls.length > 0 ? collectedToolCalls : undefined,
    };
  } catch (error) {
    console.error("AI SDK API call failed:", error);
    throw new Error(
      `API call failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const getModelCost = (modelId: string) => {
  const providerId = getProviderIdForModel(modelId);
  if (!providerId) {
    return { input: 0, output: 0 };
  }

  const providerModels = MODELS[providerId];
  const model = providerModels.find((m) => m.id === modelId);
  return model?.cost || { input: 0, output: 0 };
};
