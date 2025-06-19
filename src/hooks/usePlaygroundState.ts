import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Prompt,
  Message,
  Conversation,
  LLMConfig,
  Tool,
  ToolParameter,
  ToolCall,
  getProviderForModel,
} from "../types";
import { storage, createApiCall } from "../utils";

// Helper interface for form state
interface ParameterFormData {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  required: boolean;
  enum?: string[];
}

// usePlaygroundState.ts - Custom hook for managing prompt playground state
//
// Recent fix: Tools are now properly passed to API calls
// - selectedTools are filtered from the tools array based on selectedToolIds
// - Tools are passed to createApiCall which forwards them to the appropriate provider
// - Only OpenAI provider currently implements tool support
// - Other providers accept tools parameter but don't use them yet

export const usePlaygroundState = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [conversation, setConversation] = useState<Conversation>({
    id: uuidv4(),
    messages: [],
  });
  const [config, setConfig] = useState<LLMConfig>({
    model: "gemma3",
    temperature: 0.2,
    maxTokens: 5000,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([]);

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

  const selectPrompt = useCallback((prompt: Prompt) => {
    setSelectedPrompt(prompt);
    // Add system message if prompt is selected
    const systemMessage: Message = {
      id: uuidv4(),
      role: "system",
      content: prompt.content,
      timestamp: new Date(),
    };
    setConversation({
      id: uuidv4(),
      messages: [systemMessage],
      promptId: prompt.id,
    });
    setError(undefined);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (isLoading) return;

      const userMessage: Message = {
        id: uuidv4(),
        role: "user",
        content,
        timestamp: new Date(),
      };

      setConversation((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
      }));

      setIsLoading(true);
      setError(undefined);

      // Create placeholder assistant message for streaming
      const assistantMessageId = uuidv4();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      setConversation((prev) => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
      }));

      try {
        const messages = [...conversation.messages, userMessage];

        // Stream callback to update the assistant message content
        const onChunk = (chunk: string) => {
          setConversation((prev) => ({
            ...prev,
            messages: prev.messages.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: msg.content + chunk }
                : msg
            ),
          }));
        };

        // Get selected tools for the API call
        const selectedTools = tools.filter((tool) =>
          selectedToolIds.includes(tool.id)
        );

        console.log(
          `🔧 Selected ${selectedTools.length} tools for API call:`,
          selectedTools.map((t) => t.function.name)
        );

        // Tool call callback to update the assistant message with tool calls
        const onToolCall = (toolCall: ToolCall) => {
          setConversation((prev) => ({
            ...prev,
            messages: prev.messages.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    toolCalls: [...(msg.toolCalls || []), toolCall],
                  }
                : msg
            ),
          }));
        };

        // Tool result callback to add tool result messages
        const onToolResult = (
          toolCallId: string,
          result: unknown,
          error?: string
        ) => {
          const toolResultMessage: Message = {
            id: uuidv4(),
            role: "tool",
            content: error ? `Error: ${error}` : JSON.stringify(result),
            timestamp: new Date(),
            toolCallId,
          };

          setConversation((prev) => ({
            ...prev,
            messages: [...prev.messages, toolResultMessage],
          }));
        };

        const apiResult = await createApiCall(
          messages,
          config,
          selectedTools,
          onChunk,
          onToolCall,
          onToolResult
        );

        // Final update to ensure we have the complete response with metadata and tool calls
        setConversation((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: apiResult.content,
                  metadata: apiResult.metadata,
                  toolCalls: apiResult.toolCalls || msg.toolCalls,
                }
              : msg
          ),
        }));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred";
        setError(errorMessage);

        // Remove the placeholder assistant message on error
        setConversation((prev) => ({
          ...prev,
          messages: prev.messages.filter(
            (msg) => msg.id !== assistantMessageId
          ),
        }));
      } finally {
        setIsLoading(false);
      }
    },
    [conversation.messages, config, isLoading, tools, selectedToolIds]
  );

  const updateConfig = useCallback((newConfig: Partial<LLMConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
    setError(undefined);
  }, []);

  const updateModel = useCallback((model: string) => {
    const provider = getProviderForModel(model);
    if (!provider) {
      setError(`Unknown model: ${model}`);
      return;
    }

    setConfig((prev) => ({ ...prev, model }));
    setError(undefined);
  }, []);

  const clearConversation = useCallback(() => {
    setConversation({
      id: uuidv4(),
      messages: selectedPrompt
        ? [
            {
              id: uuidv4(),
              role: "system",
              content: selectedPrompt.content,
              timestamp: new Date(),
            },
          ]
        : [],
      promptId: selectedPrompt?.id,
    });
    setError(undefined);
  }, [selectedPrompt]);

  const startNewConversation = useCallback(() => {
    setSelectedPrompt(null);
    setConversation({
      id: uuidv4(),
      messages: [],
    });
    setError(undefined);
  }, []);

  return {
    // State
    prompts,
    selectedPrompt,
    conversation,
    config,
    isLoading,
    error,
    tools,
    selectedToolIds,

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
