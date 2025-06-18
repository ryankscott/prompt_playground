import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Prompt,
  Message,
  Conversation,
  LLMConfig,
  getProviderForModel,
} from "../types";
import { storage, createApiCall } from "../utils";

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

  // Load data from localStorage on mount
  useEffect(() => {
    const savedPrompts = storage.getPrompts();
    const savedConfig = storage.getConfig();

    setPrompts(savedPrompts);
    setConfig((prev) => ({ ...prev, ...savedConfig }));
  }, []);

  // Save prompts to localStorage when they change
  useEffect(() => {
    storage.savePrompts(prompts);
  }, [prompts]);

  // Save config to localStorage when it changes
  useEffect(() => {
    storage.saveConfig(config);
  }, [config]);

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

        const apiResult = await createApiCall(messages, config, onChunk);

        // Final update to ensure we have the complete response with metadata
        setConversation((prev) => ({
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: apiResult.content,
                  metadata: apiResult.metadata,
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
    [conversation.messages, config, isLoading]
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
  };
};
