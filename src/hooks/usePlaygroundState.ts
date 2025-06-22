import { useState, useEffect, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { useChat } from "@ai-sdk/react";
import {
  Prompt,
  Message,
  Conversation,
  LLMConfig,
  Tool,
  ToolParameter,
  ParameterFormData,
  getProviderForModel,
  getModelInfo,
  MessageMetadata,
} from "../types";
import { storage } from "../utils";

// usePlaygroundState.ts - Custom hook for managing prompt playground state
//
// This hook manages all LLM interactions through the Vercel AI SDK:
// - selectedTools are filtered from the tools array based on selectedToolIds
// - All model calls go through the AI SDK's useChat hook and /api/chat endpoint
// - Tool calls are handled via the AI SDK's onToolCall callback
// - Messages are synchronized between AI SDK state and application state

export const usePlaygroundState = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [conversationId, setConversationId] = useState<string>(uuidv4());
  const [conversation, setConversation] = useState<Conversation>({
    id: conversationId,
    messages: [],
  });
  const [config, setConfig] = useState<LLMConfig>({
    model: "llama:3.2",
    temperature: 0.2,
    maxTokens: 5000,
  });
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([]);

  // Track message metadata to transfer from AI SDK to app messages
  const messageMetadataRef = useRef<Map<string, MessageMetadata>>(new Map());
  const requestStartTimeRef = useRef<number>(Date.now());

  // Get selected tools
  const selectedTools = tools.filter((tool) =>
    selectedToolIds.includes(tool.id)
  );

  // AI SDK chat hook for managing message state and API interactions
  const {
    messages: aiMessages,
    append,
    error,
    status,
    setMessages: setAiMessages,
    reload,
    stop,
    input,
    handleInputChange,
    handleSubmit,
  } = useChat({
    api: "/api/chat",
    id: conversationId,
    body: {
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      tools: selectedTools,
    },

    onError: (chatError) => {
      console.error("Chat error:", chatError.message);
    },

    onResponse: (response) => {
      if (!response.ok) {
        console.error(`API Error: ${response.statusText}`);
      }
    },

    onFinish: (message, options) => {
      // Store metadata to be used in message synchronization
      if (options?.usage) {
        const usage = options.usage;
        const modelInfo = getModelInfo(config.model);

        const messageMetadata: MessageMetadata = {
          tokenUsage: {
            inputTokens: usage.promptTokens || 0,
            outputTokens: usage.completionTokens || 0,
            totalTokens: usage.totalTokens || 0,
          },
          // Calculate cost if we have pricing info
          cost: modelInfo?.cost
            ? ((usage.promptTokens || 0) * modelInfo.cost.input) / 1000000 +
              ((usage.completionTokens || 0) * modelInfo.cost.output) / 1000000
            : undefined,
          // Calculate timing from request start to completion
          timeTaken: Date.now() - requestStartTimeRef.current,
        };

        // Store metadata for this message ID to be used in synchronization
        messageMetadataRef.current.set(message.id, messageMetadata);
      }
    },
  });

  // Load data from localStorage on mount
  useEffect(() => {
    const savedPrompts = storage.getPrompts();
    const savedConfig = storage.getConfig();
    const savedTools = storage.getTools();

    setPrompts(savedPrompts);
    setConfig((prev) => ({ ...prev, ...savedConfig }));
    setTools(savedTools);
  }, []);

  // Save prompts to localStorage when they change
  useEffect(() => {
    storage.savePrompts(prompts);
  }, [prompts]);

  // Save config to localStorage when it changes
  useEffect(() => {
    storage.saveConfig(config);
  }, [config]);

  // Save tools to localStorage when they change
  useEffect(() => {
    storage.saveTools(tools);
  }, [tools]);

  const createPrompt = useCallback((name: string, content: string) => {
    const newPrompt: Prompt = {
      id: uuidv4(),
      name,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setPrompts((prev) => [newPrompt, ...prev]);
    return newPrompt;
  }, []);

  const updatePrompt = useCallback(
    (id: string, name: string, content: string) => {
      setPrompts((prev) =>
        prev.map((prompt) =>
          prompt.id === id
            ? { ...prompt, name, content, updatedAt: new Date() }
            : prompt
        )
      );
      if (selectedPrompt?.id === id) {
        setSelectedPrompt((prev) =>
          prev ? { ...prev, name, content, updatedAt: new Date() } : null
        );
      }
    },
    [selectedPrompt]
  );

  const deletePrompt = useCallback(
    (id: string) => {
      setPrompts((prev) => prev.filter((prompt) => prompt.id !== id));
      if (selectedPrompt?.id === id) {
        setSelectedPrompt(null);
      }
    },
    [selectedPrompt]
  );

  const exportPrompts = useCallback(() => {
    storage.exportPrompts(prompts);
  }, [prompts]);

  const importPrompts = useCallback(async () => {
    const importedPrompts = await storage.importPrompts();
    // Merge imported prompts with existing ones, avoiding duplicates by name
    setPrompts((prev) => {
      const existingNames = new Set(prev.map((p) => p.name));
      const newPrompts = importedPrompts.filter(
        (p) => !existingNames.has(p.name)
      );
      return [...newPrompts, ...prev];
    });
    return importedPrompts.length;
  }, []);

  const createTool = useCallback(
    (
      name: string,
      description: string,
      parameters: ParameterFormData[],
      code: string,
      emoji?: string
    ) => {
      // Convert old parameter format to new format
      const properties: Record<string, ToolParameter> = {};
      const required: string[] = [];

      parameters.forEach((param) => {
        properties[param.name] = {
          type: param.type,
          description: param.description,
          ...(param.enum && { enum: param.enum }),
        };
        if (param.required) {
          required.push(param.name);
        }
      });

      const newTool: Tool = {
        id: uuidv4(),
        type: "function",
        function: {
          name,
          description,
          parameters: {
            type: "object",
            properties,
            required,
          },
        },
        code,
        emoji,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setTools((prev) => [newTool, ...prev]);
      return newTool;
    },
    []
  );

  const updateTool = useCallback(
    (
      id: string,
      name: string,
      description: string,
      parameters: ParameterFormData[],
      code: string,
      emoji?: string
    ) => {
      // Convert old parameter format to new format
      const properties: Record<string, ToolParameter> = {};
      const required: string[] = [];

      parameters.forEach((param) => {
        properties[param.name] = {
          type: param.type,
          description: param.description,
          ...(param.enum && { enum: param.enum }),
        };
        if (param.required) {
          required.push(param.name);
        }
      });

      setTools((prev) =>
        prev.map((tool) =>
          tool.id === id
            ? {
                ...tool,
                function: {
                  name,
                  description,
                  parameters: {
                    type: "object",
                    properties,
                    required,
                  },
                },
                code,
                emoji,
                updatedAt: new Date(),
              }
            : tool
        )
      );
    },
    []
  );

  const deleteTool = useCallback((id: string) => {
    setTools((prev) => prev.filter((tool) => tool.id !== id));
    setSelectedToolIds((prev) => prev.filter((toolId) => toolId !== id));
  }, []);

  const toggleTool = useCallback((toolId: string) => {
    setSelectedToolIds((prev) =>
      prev.includes(toolId)
        ? prev.filter((id) => id !== toolId)
        : [...prev, toolId]
    );
  }, []);

  const exportTools = useCallback(() => {
    storage.exportTools(tools);
  }, [tools]);

  const importTools = useCallback(async () => {
    const importedTools = await storage.importTools();
    setTools((prev) => {
      const existingNames = new Set(prev.map((t) => t.function.name));
      const newTools = importedTools.filter(
        (t) => !existingNames.has(t.function.name)
      );
      return [...newTools, ...prev];
    });
    return importedTools.length;
  }, []);

  const selectPrompt = useCallback(
    (prompt: Prompt) => {
      // Set selected prompt
      setSelectedPrompt(prompt);

      // Generate new conversation ID
      const newId = uuidv4();
      setConversationId(newId);

      // Create system message
      const systemMessage: Message = {
        id: uuidv4(),
        role: "system",
        content: prompt.content,
        timestamp: new Date(),
      };

      // Set conversation with system message
      setConversation({
        id: newId,
        messages: [systemMessage],
        promptId: prompt.id,
      });

      // Reset AI SDK messages and add system message
      setAiMessages([
        {
          id: systemMessage.id,
          role: "system",
          content: prompt.content,
        },
      ]);
    },
    [setAiMessages]
  );

  // Custom message handling - synchronizes AI SDK messages with our app's format
  useEffect(() => {
    if (aiMessages.length > 0) {
      // Convert AI SDK messages to our app's format
      const appMessages: Message[] = aiMessages.map((aiMsg) => {
        // Basic message properties
        const message: Message = {
          id: aiMsg.id,
          role: aiMsg.role as "user" | "assistant" | "system" | "tool",
          content: aiMsg.content,
          timestamp: new Date(),
        };

        // Add metadata if available for this message
        const storedMetadata = messageMetadataRef.current.get(aiMsg.id);
        if (storedMetadata) {
          message.metadata = storedMetadata;
        }

        // Process tool calls if they exist
        if (aiMsg.role === "assistant" && aiMsg.parts) {
          const toolCallParts = aiMsg.parts
            .filter((part) => part.type === "tool-invocation")
            .map((part) => {
              if (part.type === "tool-invocation") {
                return {
                  id: part.toolInvocation.toolCallId,
                  name: part.toolInvocation.toolName,
                  arguments: part.toolInvocation.args,
                };
              }
              return null;
            })
            .filter((part): part is NonNullable<typeof part> => part !== null);

          if (toolCallParts.length > 0) {
            message.toolCalls = toolCallParts;
          }
        }

        return message;
      });

      // Update our application's conversation state
      setConversation((prev) => ({
        ...prev,
        messages: appMessages,
      }));
    }
  }, [aiMessages]);

  // Send message using Vercel AI SDK
  const sendMessage = async (content: string) => {
    try {
      // Set request start time right before making the API call
      requestStartTimeRef.current = Date.now();

      // Use the AI SDK append function to send the message
      await append({
        role: "user",
        content,
      });
    } catch (err) {
      console.error(
        "Send message error:",
        err instanceof Error ? err.message : String(err)
      );
    }
  };

  // Wrapper for handleSubmit to ensure proper timing
  const wrappedHandleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    // Set request start time right before the form submission
    requestStartTimeRef.current = Date.now();

    // Call the original handleSubmit from AI SDK
    handleSubmit(e);
  };

  const updateConfig = useCallback((newConfig: Partial<LLMConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  }, []);

  const updateModel = useCallback((model: string) => {
    const provider = getProviderForModel(model);
    if (!provider) {
      console.error(`Unknown model: ${model}`);
      return;
    }
    setConfig((prev) => ({ ...prev, model }));
  }, []);

  const clearConversation = useCallback(() => {
    // Generate new conversation ID
    const newId = uuidv4();
    setConversationId(newId);

    // Reset conversation with system message if prompt is selected
    const systemMessage = selectedPrompt
      ? {
          id: uuidv4(),
          role: "system" as const,
          content: selectedPrompt.content,
          timestamp: new Date(),
        }
      : null;

    setConversation({
      id: newId,
      messages: systemMessage ? [systemMessage] : [],
      promptId: selectedPrompt?.id,
    });

    // Reset AI SDK messages with system message if present
    const aiSystemMessage = systemMessage
      ? {
          id: systemMessage.id,
          role: "system" as const,
          content: systemMessage.content,
        }
      : null;

    setAiMessages(aiSystemMessage ? [aiSystemMessage] : []);
  }, [selectedPrompt, setAiMessages]);

  const startNewConversation = useCallback(() => {
    // Deselect prompt
    setSelectedPrompt(null);

    // Generate new conversation ID
    const newId = uuidv4();
    setConversationId(newId);

    // Reset conversation
    setConversation({
      id: newId,
      messages: [],
    });

    // Reset AI SDK messages
    setAiMessages([]);
  }, [setAiMessages]);

  // Get current model info
  const currentModel = getModelInfo(config.model);

  return {
    // State
    prompts,
    selectedPrompt,
    conversation,
    config,
    currentModel,
    error,
    tools,
    selectedToolIds,

    // AI SDK direct access - expose these for components that need them
    aiMessages,
    input,
    status,
    aiStatus: status, // Alias for clarity
    handleInputChange,
    handleSubmit: wrappedHandleSubmit, // Use our wrapped version for proper timing
    reload,
    stop,

    // Actions
    createPrompt,
    updatePrompt,
    deletePrompt,
    selectPrompt,
    sendMessage,
    updateConfig,
    updateModel,
    clearConversation,
    startNewConversation,
    exportPrompts,
    importPrompts,
    createTool,
    updateTool,
    deleteTool,
    toggleTool,
    exportTools,
    importTools,
  };
};
