import type {
  Prompt,
  LLMConfig,
  Message,
  TokenUsage,
  Tool,
  ToolCall,
} from "./types";
import { MODELS, getProviderForModel, getModelInfo } from "./types";

const PROMPTS_KEY = "playground_prompts";
const CONFIG_KEY = "playground_config";
const PROVIDER_CONFIGS_KEY = "playground_provider_configs";
const TOOLS_KEY = "playground_tools";

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
  const provider = getProviderForModel(config.model);

  if (!provider) {
    throw new Error(`Unknown provider for model: ${config.model}`);
  }

  // Merge provider-specific configs with base config
  const providerConfigs = storage.getProviderConfigs();
  const providerConfig = providerConfigs[provider];
  const mergedConfig: LLMConfig = {
    ...config,
    ...(providerConfig?.apiKey && { apiKey: providerConfig.apiKey }),
    ...(providerConfig?.baseUrl && { baseUrl: providerConfig.baseUrl }),
  };

  console.log(`🔧 API call with ${tools.length} tools to ${provider} provider`);

  let result: {
    content: string;
    tokenUsage?: TokenUsage;
    toolCalls?: ToolCall[];
  };

  switch (provider) {
    case "openai":
      result = await callOpenAI(
        messages,
        mergedConfig,
        tools,
        onChunk,
        onToolCall,
        onToolResult
      );
      break;
    case "anthropic":
      result = await callAnthropic(
        messages,
        mergedConfig,
        tools,
        onChunk,
        onToolCall,
        onToolResult
      );
      break;
    case "google":
      result = await callGoogle(
        messages,
        mergedConfig,
        tools,
        onChunk,
        onToolCall,
        onToolResult
      );
      break;
    case "ollama":
      result = await callOllama(messages, mergedConfig, tools, onChunk);
      break;
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }

  const timeTaken = Date.now() - startTime;
  const cost = result.tokenUsage
    ? calculateCost(result.tokenUsage, mergedConfig.model)
    : undefined;

  return {
    content: result.content,
    metadata: {
      tokenUsage: result.tokenUsage,
      timeTaken,
      cost,
    },
    toolCalls: result.toolCalls,
  };
};

const callOpenAI = async (
  messages: Message[],
  config: LLMConfig,
  tools: Tool[] = [],
  onChunk?: (chunk: string) => void,
  onToolCall?: (toolCall: ToolCall) => void,
  onToolResult?: (toolCallId: string, result: unknown, error?: string) => void
): Promise<{
  content: string;
  tokenUsage?: TokenUsage;
  toolCalls?: ToolCall[];
}> => {
  if (!config.apiKey) {
    throw new Error("OpenAI API key is required");
  }

  // Convert tools to OpenAI format
  const openAITools = tools.map((tool) => ({
    type: "function",
    function: {
      name: tool.function.name,
      description: tool.function.description,
      parameters: tool.function.parameters,
    },
  }));

  // Helper function to make API call
  const makeApiCall = async (
    messagesToSend: Message[]
  ): Promise<{
    content: string;
    tokenUsage?: TokenUsage;
    toolCalls?: ToolCall[];
  }> => {
    const requestBody: Record<string, unknown> = {
      model: config.model,
      messages: messagesToSend.map((msg) => ({
        role: msg.role,
        content: msg.content,
        ...(msg.toolCalls && {
          tool_calls: msg.toolCalls.map((tc) => ({
            id: tc.id,
            type: "function",
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.arguments),
            },
          })),
        }),
        ...(msg.toolCallId && { tool_call_id: msg.toolCallId }),
      })),
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      // Disable streaming when tools are present to handle tool calls properly
      stream: !!onChunk && openAITools.length === 0,
    };

    // Only add tools if there are any and model supports them
    if (openAITools.length > 0) {
      console.log(
        `🔧 Sending ${openAITools.length} tools to OpenAI:`,
        openAITools.map((t) => t.function.name)
      );
      requestBody.tools = openAITools;
      requestBody.tool_choice = "auto";
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `OpenAI API error: ${error.error?.message || "Unknown error"}`
      );
    }

    if (onChunk && openAITools.length === 0 && response.body) {
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
      const message = data.choices[0]?.message;
      const content = message?.content || "";
      const toolCalls = message?.tool_calls;
      const usage = data.usage;

      const tokenUsage: TokenUsage | undefined = usage
        ? {
            inputTokens: usage.prompt_tokens || 0,
            outputTokens: usage.completion_tokens || 0,
            totalTokens: usage.total_tokens || 0,
          }
        : undefined;

      // Convert OpenAI tool calls to our format - check if tool_calls exist in message
      let formattedToolCalls: ToolCall[] | undefined;
      if (toolCalls && Array.isArray(toolCalls) && toolCalls.length > 0) {
        formattedToolCalls = toolCalls.map(
          (tc: {
            id: string;
            function: { name: string; arguments: string };
          }) => ({
            id: tc.id,
            name: tc.function.name,
            arguments: parseToolArguments(tc.function.arguments),
          })
        );

        logToolCallDetection("OpenAI", formattedToolCalls);
      }

      return { content, tokenUsage, toolCalls: formattedToolCalls };
    }
  };

  // Initial API call
  const initialResult = await makeApiCall(messages);

  // If no tool calls, return the result
  if (!initialResult.toolCalls || initialResult.toolCalls.length === 0) {
    return initialResult;
  }

  // Handle tool calls
  const toolCallsToExecute = initialResult.toolCalls;
  const messagesWithToolCalls = [...messages];

  // Add assistant message with tool calls
  const assistantMessage: Message = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: initialResult.content,
    timestamp: new Date(),
    toolCalls: toolCallsToExecute,
  };
  messagesWithToolCalls.push(assistantMessage);

  // Execute tools and add results
  for (const toolCall of toolCallsToExecute) {
    // Notify UI about tool call
    if (onToolCall) {
      onToolCall(toolCall);
    }

    try {
      // Find the tool
      const tool = tools.find((t) => t.function.name === toolCall.name);
      if (!tool) {
        throw new Error(`Tool "${toolCall.name}" not found`);
      }

      // Execute the tool
      const result = await executeTool(tool, toolCall.arguments);

      // Notify UI about tool result
      if (onToolResult) {
        onToolResult(toolCall.id, result);
      }

      // Add tool result message
      const toolResultMessage: Message = {
        id: crypto.randomUUID(),
        role: "tool",
        content: JSON.stringify(result),
        timestamp: new Date(),
        toolCallId: toolCall.id,
      };
      messagesWithToolCalls.push(toolResultMessage);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Notify UI about tool error
      if (onToolResult) {
        onToolResult(toolCall.id, null, errorMessage);
      }

      // Add error result message
      const errorResultMessage: Message = {
        id: crypto.randomUUID(),
        role: "tool",
        content: `Error: ${errorMessage}`,
        timestamp: new Date(),
        toolCallId: toolCall.id,
      };
      messagesWithToolCalls.push(errorResultMessage);
    }
  }

  // Make final API call with tool results
  const finalResult = await makeApiCall(messagesWithToolCalls);

  // Combine token usage if available
  const combinedTokenUsage: TokenUsage | undefined =
    initialResult.tokenUsage && finalResult.tokenUsage
      ? {
          inputTokens:
            initialResult.tokenUsage.inputTokens +
            finalResult.tokenUsage.inputTokens,
          outputTokens:
            initialResult.tokenUsage.outputTokens +
            finalResult.tokenUsage.outputTokens,
          totalTokens:
            initialResult.tokenUsage.totalTokens +
            finalResult.tokenUsage.totalTokens,
        }
      : finalResult.tokenUsage || initialResult.tokenUsage;

  return {
    content: finalResult.content,
    tokenUsage: combinedTokenUsage,
    toolCalls: toolCallsToExecute, // Return the original tool calls for UI display
  };
};

const callAnthropic = async (
  messages: Message[],
  config: LLMConfig,
  tools: Tool[] = [],
  onChunk?: (chunk: string) => void,
  onToolCall?: (toolCall: ToolCall) => void,
  onToolResult?: (toolCallId: string, result: unknown, error?: string) => void
): Promise<{
  content: string;
  tokenUsage?: TokenUsage;
  toolCalls?: ToolCall[];
}> => {
  if (!config.apiKey) {
    throw new Error("Anthropic API key is required");
  }

  // Convert tools to Anthropic format
  const anthropicTools = tools.map((tool) => ({
    name: tool.function.name,
    description: tool.function.description,
    input_schema: tool.function.parameters,
  }));

  // Helper function to make API call
  const makeApiCall = async (
    messagesToSend: Message[]
  ): Promise<{
    content: string;
    tokenUsage?: TokenUsage;
    toolCalls?: ToolCall[];
  }> => {
    const requestBody: Record<string, unknown> = {
      model: config.model,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      stream: !!onChunk && anthropicTools.length === 0,
      messages: messagesToSend
        .filter((msg) => msg.role !== "system")
        .map((msg) => {
          if (msg.role === "tool") {
            return {
              role: "user",
              content: [
                {
                  type: "tool_result",
                  tool_use_id: msg.toolCallId,
                  content: msg.content,
                },
              ],
            };
          }

          if (msg.toolCalls) {
            return {
              role: msg.role,
              content: [
                ...(msg.content ? [{ type: "text", text: msg.content }] : []),
                ...msg.toolCalls.map((tc) => ({
                  type: "tool_use",
                  id: tc.id,
                  name: tc.name,
                  input: tc.arguments,
                })),
              ],
            };
          }

          return {
            role: msg.role,
            content: msg.content,
          };
        }),
      system: messages.find((msg) => msg.role === "system")?.content,
    };

    // Only add tools if there are any
    if (anthropicTools.length > 0) {
      console.log(
        `🔧 Sending ${anthropicTools.length} tools to Anthropic:`,
        anthropicTools.map((t) => t.name)
      );
      requestBody.tools = anthropicTools;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Anthropic API error: ${error.error?.message || "Unknown error"}`
      );
    }

    if (onChunk && anthropicTools.length === 0 && response.body) {
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
      let content = "";
      const toolCalls: ToolCall[] = [];

      // Parse content and tool calls from Anthropic response
      if (data.content && Array.isArray(data.content)) {
        for (const block of data.content) {
          if (block.type === "text") {
            content += block.text;
          } else if (block.type === "tool_use") {
            toolCalls.push({
              id: block.id,
              name: block.name,
              arguments: block.input,
            });
          }
        }
      }

      // Log detected tool calls
      if (toolCalls.length > 0) {
        logToolCallDetection("Anthropic", toolCalls);
      }

      const usage = data.usage;
      const tokenUsage: TokenUsage | undefined = usage
        ? {
            inputTokens: usage.input_tokens || 0,
            outputTokens: usage.output_tokens || 0,
            totalTokens: (usage.input_tokens || 0) + (usage.output_tokens || 0),
          }
        : undefined;

      return {
        content,
        tokenUsage,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      };
    }
  };

  // Initial API call
  const initialResult = await makeApiCall(messages);

  // If no tool calls, return the result
  if (!initialResult.toolCalls || initialResult.toolCalls.length === 0) {
    return initialResult;
  }

  // Handle tool calls
  const toolCallsToExecute = initialResult.toolCalls;
  const messagesWithToolCalls = [...messages];

  // Add assistant message with tool calls
  const assistantMessage: Message = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: initialResult.content,
    timestamp: new Date(),
    toolCalls: toolCallsToExecute,
  };
  messagesWithToolCalls.push(assistantMessage);

  // Execute tools and add results
  for (const toolCall of toolCallsToExecute) {
    // Notify UI about tool call
    if (onToolCall) {
      onToolCall(toolCall);
    }

    try {
      // Find the tool
      const tool = tools.find((t) => t.function.name === toolCall.name);
      if (!tool) {
        throw new Error(`Tool "${toolCall.name}" not found`);
      }

      // Execute the tool
      const result = await executeTool(tool, toolCall.arguments);

      // Notify UI about tool result
      if (onToolResult) {
        onToolResult(toolCall.id, result);
      }

      // Add tool result message
      const toolResultMessage: Message = {
        id: crypto.randomUUID(),
        role: "tool",
        content: JSON.stringify(result),
        timestamp: new Date(),
        toolCallId: toolCall.id,
      };
      messagesWithToolCalls.push(toolResultMessage);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Notify UI about tool error
      if (onToolResult) {
        onToolResult(toolCall.id, null, errorMessage);
      }

      // Add error result message
      const errorResultMessage: Message = {
        id: crypto.randomUUID(),
        role: "tool",
        content: `Error: ${errorMessage}`,
        timestamp: new Date(),
        toolCallId: toolCall.id,
      };
      messagesWithToolCalls.push(errorResultMessage);
    }
  }

  // Make final API call with tool results
  const finalResult = await makeApiCall(messagesWithToolCalls);

  // Combine token usage if available
  const combinedTokenUsage: TokenUsage | undefined =
    initialResult.tokenUsage && finalResult.tokenUsage
      ? {
          inputTokens:
            initialResult.tokenUsage.inputTokens +
            finalResult.tokenUsage.inputTokens,
          outputTokens:
            initialResult.tokenUsage.outputTokens +
            finalResult.tokenUsage.outputTokens,
          totalTokens:
            initialResult.tokenUsage.totalTokens +
            finalResult.tokenUsage.totalTokens,
        }
      : finalResult.tokenUsage || initialResult.tokenUsage;

  return {
    content: finalResult.content,
    tokenUsage: combinedTokenUsage,
    toolCalls: toolCallsToExecute, // Return the original tool calls for UI display
  };
};

const callGoogle = async (
  messages: Message[],
  config: LLMConfig,
  tools: Tool[] = [],
  onChunk?: (chunk: string) => void,
  onToolCall?: (toolCall: ToolCall) => void,
  onToolResult?: (toolCallId: string, result: unknown, error?: string) => void
): Promise<{
  content: string;
  tokenUsage?: TokenUsage;
  toolCalls?: ToolCall[];
}> => {
  if (!config.apiKey) {
    throw new Error("Google API key is required");
  }

  // Convert tools to Google format
  const googleTools = tools.map((tool) => ({
    functionDeclarations: [
      {
        name: tool.function.name,
        description: tool.function.description,
        parameters: tool.function.parameters,
      },
    ],
  }));

  // Helper function to make API call
  const makeApiCall = async (
    messagesToSend: Message[]
  ): Promise<{
    content: string;
    tokenUsage?: TokenUsage;
    toolCalls?: ToolCall[];
  }> => {
    const requestBody: Record<string, unknown> = {
      contents: messagesToSend
        .filter((msg) => msg.role !== "system")
        .map((msg) => {
          if (msg.role === "tool") {
            // Find the tool name by looking up the tool call ID in previous messages
            let toolName = "unknown";
            for (const prevMsg of messagesToSend) {
              if (prevMsg.toolCalls) {
                const toolCall = prevMsg.toolCalls.find(
                  (tc) => tc.id === msg.toolCallId
                );
                if (toolCall) {
                  toolName = toolCall.name;
                  break;
                }
              }
            }

            return {
              role: "function",
              parts: [
                {
                  functionResponse: {
                    name: toolName,
                    response: JSON.parse(msg.content),
                  },
                },
              ],
            };
          }

          if (msg.toolCalls) {
            return {
              role: msg.role === "assistant" ? "model" : "user",
              parts: [
                ...(msg.content ? [{ text: msg.content }] : []),
                ...msg.toolCalls.map((tc) => ({
                  functionCall: {
                    name: tc.name,
                    args: tc.arguments,
                  },
                })),
              ],
            };
          }

          return {
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }],
          };
        }),
      generationConfig: {
        temperature: config.temperature,
        maxOutputTokens: config.maxTokens,
      },
      systemInstruction: messages.find((msg) => msg.role === "system")?.content
        ? {
            parts: [
              { text: messages.find((msg) => msg.role === "system")!.content },
            ],
          }
        : undefined,
    };

    // Only add tools if there are any
    if (googleTools.length > 0) {
      console.log(
        `🔧 Sending ${googleTools.length} tools to Google:`,
        googleTools.map((t) => t.functionDeclarations[0].name)
      );
      requestBody.tools = googleTools;
    }

    // For Google API, we'll use non-streaming for tool calls to handle properly
    const useStreaming = !!onChunk && tools.length === 0;
    const endpoint = useStreaming ? "streamGenerateContent" : "generateContent";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:${endpoint}?key=${config.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Google API error: ${error.error?.message || "Unknown error"}`
      );
    }

    if (useStreaming && response.body) {
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
                const content =
                  parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                if (content) {
                  fullContent += content;
                  onChunk!(content);
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
      const data = await response.json();
      const candidate = data.candidates?.[0];
      let content = "";
      const toolCalls: ToolCall[] = [];

      // Parse content and function calls from Google response
      if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.text) {
            content += part.text;
          } else if (part.functionCall) {
            toolCalls.push({
              id: crypto.randomUUID(), // Google doesn't provide IDs, so we generate them
              name: part.functionCall.name,
              arguments: part.functionCall.args || {},
            });
          }
        }
      }

      // Log detected tool calls
      if (toolCalls.length > 0) {
        logToolCallDetection("Google", toolCalls);
      }

      const usage = data.usageMetadata;
      const tokenUsage: TokenUsage | undefined = usage
        ? {
            inputTokens: usage.promptTokenCount || 0,
            outputTokens: usage.candidatesTokenCount || 0,
            totalTokens: usage.totalTokenCount || 0,
          }
        : undefined;

      return {
        content,
        tokenUsage,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      };
    }
  };

  // Initial API call
  const initialResult = await makeApiCall(messages);

  // If no tool calls, return the result
  if (!initialResult.toolCalls || initialResult.toolCalls.length === 0) {
    return initialResult;
  }

  // Handle tool calls
  const toolCallsToExecute = initialResult.toolCalls;
  const messagesWithToolCalls = [...messages];

  // Add assistant message with tool calls
  const assistantMessage: Message = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: initialResult.content,
    timestamp: new Date(),
    toolCalls: toolCallsToExecute,
  };
  messagesWithToolCalls.push(assistantMessage);

  // Execute tools and add results
  for (const toolCall of toolCallsToExecute) {
    // Notify UI about tool call
    if (onToolCall) {
      onToolCall(toolCall);
    }

    try {
      // Find the tool
      const tool = tools.find((t) => t.function.name === toolCall.name);
      if (!tool) {
        throw new Error(`Tool "${toolCall.name}" not found`);
      }

      // Execute the tool
      const result = await executeTool(tool, toolCall.arguments);

      // Notify UI about tool result
      if (onToolResult) {
        onToolResult(toolCall.id, result);
      }

      // Add tool result message
      const toolResultMessage: Message = {
        id: crypto.randomUUID(),
        role: "tool",
        content: JSON.stringify(result),
        timestamp: new Date(),
        toolCallId: toolCall.id,
      };
      messagesWithToolCalls.push(toolResultMessage);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Notify UI about tool error
      if (onToolResult) {
        onToolResult(toolCall.id, null, errorMessage);
      }

      // Add error result message
      const errorResultMessage: Message = {
        id: crypto.randomUUID(),
        role: "tool",
        content: `Error: ${errorMessage}`,
        timestamp: new Date(),
        toolCallId: toolCall.id,
      };
      messagesWithToolCalls.push(errorResultMessage);
    }
  }

  // Make final API call with tool results
  const finalResult = await makeApiCall(messagesWithToolCalls);

  // Combine token usage if available
  const combinedTokenUsage: TokenUsage | undefined =
    initialResult.tokenUsage && finalResult.tokenUsage
      ? {
          inputTokens:
            initialResult.tokenUsage.inputTokens +
            finalResult.tokenUsage.inputTokens,
          outputTokens:
            initialResult.tokenUsage.outputTokens +
            finalResult.tokenUsage.outputTokens,
          totalTokens:
            initialResult.tokenUsage.totalTokens +
            finalResult.tokenUsage.totalTokens,
        }
      : finalResult.tokenUsage || initialResult.tokenUsage;

  return {
    content: finalResult.content,
    tokenUsage: combinedTokenUsage,
    toolCalls: toolCallsToExecute, // Return the original tool calls for UI display
  };
};

const callOllama = async (
  messages: Message[],
  config: LLMConfig,
  tools: Tool[] = [],
  onChunk?: (chunk: string) => void
): Promise<{
  content: string;
  tokenUsage?: TokenUsage;
  toolCalls?: ToolCall[];
}> => {
  const baseUrl = config.baseUrl || "http://localhost:11434";

  // Check if model supports tools
  const modelInfo = getModelInfo(config.model);
  const supportsTools = modelInfo?.supportsTools && tools.length > 0;

  // Convert tools to Ollama format (similar to OpenAI)
  const ollamaTools = supportsTools
    ? tools.map((tool) => ({
        type: "function",
        function: {
          name: tool.function.name,
          description: tool.function.description,
          parameters: tool.function.parameters,
        },
      }))
    : [];

  console.log({ tools: ollamaTools, supportsTools });

  // Helper function to make API call
  const makeApiCall = async (
    messagesToSend: Message[]
  ): Promise<{
    content: string;
    tokenUsage?: TokenUsage;
    toolCalls?: ToolCall[];
  }> => {
    const requestBody: Record<string, unknown> = {
      model: config.model,
      messages: messagesToSend.map((msg) => {
        if (msg.role === "tool") {
          return {
            role: "tool",
            content: msg.content,
            tool_call_id: msg.toolCallId,
          };
        }

        if (msg.toolCalls) {
          return {
            role: msg.role,
            content: msg.content,
            tool_calls: msg.toolCalls.map((tc) => ({
              id: tc.id,
              type: "function",
              function: {
                name: tc.name,
                arguments: tc.arguments, // Send as object, not stringified
              },
            })),
          };
        }

        return {
          role: msg.role,
          content: msg.content,
        };
      }),
      stream: !supportsTools && !!onChunk, // Disable streaming for tool calls
      options: {
        temperature: config.temperature,
        num_predict: config.maxTokens,
      },
    };

    // Only add tools if supported and available
    if (supportsTools) {
      console.log(
        `🔧 Sending ${ollamaTools.length} tools to Ollama:`,
        ollamaTools.map((t) => t.function.name)
      );
      requestBody.tools = ollamaTools;
    }

    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    if (!supportsTools && onChunk && response.body) {
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
      const toolCalls: ToolCall[] = [];

      // Parse tool calls from Ollama response (if supported)
      if (data.message?.tool_calls) {
        for (const tc of data.message.tool_calls) {
          toolCalls.push({
            id: tc.id,
            name: tc.function.name,
            arguments: parseToolArguments(tc.function.arguments),
          });
        }
      }

      // Log detected tool calls
      if (toolCalls.length > 0) {
        logToolCallDetection("Ollama", toolCalls);
      }

      // Ollama provides token counts in the response
      const tokenUsage: TokenUsage | undefined =
        data.prompt_eval_count && data.eval_count
          ? {
              inputTokens: data.prompt_eval_count,
              outputTokens: data.eval_count,
              totalTokens: data.prompt_eval_count + data.eval_count,
            }
          : undefined;

      return {
        content,
        tokenUsage,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      };
    }
  };

  // For Ollama models that don't support tools, just make a simple call
  if (!supportsTools) {
    return await makeApiCall(messages);
  }

  // Initial API call
  const initialResult = await makeApiCall(messages);

  // If no tool calls, return the result
  if (!initialResult.toolCalls || initialResult.toolCalls.length === 0) {
    return initialResult;
  }

  // Handle tool calls (for tool-enabled Ollama models like Gemma 3)
  const toolCallsToExecute = initialResult.toolCalls;
  const messagesWithToolCalls = [...messages];

  // Add assistant message with tool calls
  const assistantMessage: Message = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: initialResult.content,
    timestamp: new Date(),
    toolCalls: toolCallsToExecute,
  };
  messagesWithToolCalls.push(assistantMessage);

  // Execute tools and add results
  for (const toolCall of toolCallsToExecute) {
    try {
      // Find the tool
      const tool = tools.find((t) => t.function.name === toolCall.name);
      if (!tool) {
        throw new Error(`Tool "${toolCall.name}" not found`);
      }

      // Execute the tool
      const result = await executeTool(tool, toolCall.arguments);

      // Add tool result message
      const toolResultMessage: Message = {
        id: crypto.randomUUID(),
        role: "tool",
        content: JSON.stringify(result),
        timestamp: new Date(),
        toolCallId: toolCall.id,
      };
      messagesWithToolCalls.push(toolResultMessage);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Add error result message
      const errorResultMessage: Message = {
        id: crypto.randomUUID(),
        role: "tool",
        content: `Error: ${errorMessage}`,
        timestamp: new Date(),
        toolCallId: toolCall.id,
      };
      messagesWithToolCalls.push(errorResultMessage);
    }
  }

  // Make final API call with tool results
  const finalResult = await makeApiCall(messagesWithToolCalls);

  // Combine token usage if available
  const combinedTokenUsage: TokenUsage | undefined =
    initialResult.tokenUsage && finalResult.tokenUsage
      ? {
          inputTokens:
            initialResult.tokenUsage.inputTokens +
            finalResult.tokenUsage.inputTokens,
          outputTokens:
            initialResult.tokenUsage.outputTokens +
            finalResult.tokenUsage.outputTokens,
          totalTokens:
            initialResult.tokenUsage.totalTokens +
            finalResult.tokenUsage.totalTokens,
        }
      : finalResult.tokenUsage || initialResult.tokenUsage;

  return {
    content: finalResult.content,
    tokenUsage: combinedTokenUsage,
    toolCalls: toolCallsToExecute, // Return the original tool calls for UI display
  };
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

// Helper function to safely parse tool arguments
const parseToolArguments = (argumentsStr: string): Record<string, unknown> => {
  try {
    if (typeof argumentsStr === "string") {
      return JSON.parse(argumentsStr);
    }
    return argumentsStr as Record<string, unknown>;
  } catch (error) {
    console.warn(`🔧 Failed to parse tool arguments:`, argumentsStr, error);
    return {};
  }
};

// Helper function to log tool call detection
const logToolCallDetection = (
  provider: string,
  toolCalls: ToolCall[]
): void => {
  if (toolCalls.length > 0) {
    console.log(
      `🔧 Detected ${toolCalls.length} tool call(s) from ${provider}:`,
      toolCalls.map((tc) => `${tc.name}(${tc.id})`)
    );
  }
};
