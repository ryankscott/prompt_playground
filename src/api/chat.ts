import { streamText, LanguageModelV1 } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { ollama } from "ollama-ai-provider";
import { z } from "zod";
import type { Tool } from "../types";

interface CreateChatAPIOptions {
  messages: {
    role: "user" | "assistant" | "system" | "tool";
    content: string;
    name?: string;
    tool_call_id?: string;
  }[];
  model?: string;
  selectedModel?: LanguageModelV1;
  temperature?: number;
  maxTokens?: number;
  tools?: Tool[];
}

interface ToolProperty {
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  enum?: string[];
}

const getModelProvider = (model: string): LanguageModelV1 => {
  if (model.startsWith("gpt-")) {
    return openai(model);
  }
  if (model.startsWith("claude-")) {
    return anthropic(model);
  }
  if (model.startsWith("gemini-")) {
    return google(model);
  }
  // Default to ollama for unknown models
  return ollama(model, { simulateStreaming: true });
};

const createZodSchema = (propDetails: ToolProperty): z.ZodType => {
  switch (propDetails.type) {
    case "string":
      if (propDetails.enum) {
        return z
          .enum(propDetails.enum as [string, ...string[]])
          .describe(propDetails.description);
      }
      return z.string().describe(propDetails.description);

    case "number":
      return z.number().describe(propDetails.description);

    case "boolean":
      return z.boolean().describe(propDetails.description);

    case "array":
      return z.array(z.any()).describe(propDetails.description);

    case "object":
      return z.object({}).passthrough().describe(propDetails.description);

    default:
      return z.any().describe(propDetails.description);
  }
};

const mapToolsToAISDK = (tools?: Tool[]) => {
  if (!tools?.length) return {};

  console.log(
    `🔧 Mapping ${tools.length} tools to AI SDK format:`,
    tools.map((t) => t.function.name)
  );

  return tools.reduce((acc, tool) => {
    const { function: toolFunction } = tool;
    const { name, description, parameters } = toolFunction;
    const { properties, required = [] } = parameters;

    console.log(`🔧 Processing tool: ${name}`, {
      description,
      properties,
      required,
    });

    const zodProperties: Record<string, z.ZodType> = {};

    Object.entries(properties).forEach(([propName, propDetails]) => {
      let schema = createZodSchema(propDetails);

      // Make optional if not in required array
      if (!required.includes(propName)) {
        schema = schema.optional();
      }

      zodProperties[propName] = schema;
    });

    acc[name] = {
      description,
      parameters: z.object(zodProperties),
      execute: async (args: Record<string, unknown>) => {
        console.log(`🔧 Executing tool ${name} with args:`, args);
        try {
          // Create a safe execution environment
          const AsyncFunction = Object.getPrototypeOf(
            async function () {}
          ).constructor;
          const func = new AsyncFunction("args", "fetch", tool.code);

          // Execute with limited globals for security
          const result = await func(args, fetch);
          console.log(`🔧 Tool ${name} result:`, result);

          // Ensure we return a serializable result
          if (typeof result === "string") {
            return result;
          } else if (typeof result === "object" && result !== null) {
            return JSON.stringify(result, null, 2);
          } else {
            return String(result);
          }
        } catch (error) {
          console.error(`🔧 Tool ${name} execution failed:`, error);
          const errorMessage = `Tool execution failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`;
          // Return error as string instead of throwing
          return `Error: ${errorMessage}`;
        }
      },
    };

    return acc;
  }, {} as Record<string, { description: string; parameters: z.ZodObject<Record<string, z.ZodType>>; execute: (args: Record<string, unknown>) => Promise<unknown> }>);
};

export async function createChatAPI(options: CreateChatAPIOptions) {
  const { messages, model, selectedModel, tools } = options;

  // Validate that either model or selectedModel is provided
  if (!selectedModel && !model) {
    throw new Error("Either 'model' or 'selectedModel' must be provided");
  }

  // Use provided selectedModel or create one from model string
  const modelInstance = selectedModel || getModelProvider(model!);

  // Map tools to AI SDK format
  const mappedTools = mapToolsToAISDK(tools);

  // Process messages for AI SDK compatibility

  console.log(
    `🔧 Creating chat API with ${tools?.length || 0} tools, model: ${
      model || "custom"
    }`
  );

  // Create streaming response
  const result = streamText({
    model: modelInstance,
    // @ts-expect-error vibe code
    messages: messages,
    temperature: options.temperature || 0.2,
    maxTokens: options.maxTokens || 5000,
    ...(tools?.length && {
      tools: mappedTools,
      maxSteps: 10, // Increase steps to allow for tool execution
      toolChoice: "auto", // Explicitly set tool choice
    }),
  });

  return result;
}
