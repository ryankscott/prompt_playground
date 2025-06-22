import React, { useState, useEffect } from "react";
import type { LLMConfig } from "../types";
import { MODELS, getProviderIdForModel } from "../models";
import { storage } from "../utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Check, Key, Settings2, Eye, EyeOff } from "lucide-react";
import { OpenAIIcon, AnthropicIcon, GoogleIcon, OllamaIcon } from "../icons";

interface SettingsPanelProps {
  config: LLMConfig;
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  config,
  isOpen,
  onClose,
}) => {
  // Define our custom provider configuration interface
  interface LocalProviderConfig {
    model: string;
    apiKey?: string;
    baseUrl?: string;
  }

  // State to track API key visibility for each provider
  const [apiKeyVisibility, setApiKeyVisibility] = useState<
    Record<string, boolean>
  >({
    openai: false,
    anthropic: false,
    google: false,
    ollama: false,
  });

  // Provider configs stored locally in the settings panel
  const [providerConfigs, setProviderConfigs] = useState<
    Record<string, LocalProviderConfig>
  >(() => {
    const storedConfigs = storage.getProviderConfigs();
    return {
      openai: {
        model: MODELS.openai?.[0]?.id || "gpt-4o-mini",
        apiKey: storedConfigs.openai?.apiKey || "",
      },
      anthropic: {
        model: MODELS.anthropic?.[0]?.id || "claude-3-opus",
        apiKey: storedConfigs.anthropic?.apiKey || "",
      },
      google: {
        model: MODELS.google?.[0]?.id || "gemini-1.5-pro",
        apiKey: storedConfigs.google?.apiKey || "",
      },
      ollama: {
        model: MODELS.ollama?.[0]?.id || "llama3",
        baseUrl: storedConfigs.ollama?.baseUrl || "http://localhost:11434",
      },
    };
  });

  // Save provider configs to localStorage when they change
  useEffect(() => {
    storage.saveProviderConfigs(providerConfigs);
  }, [providerConfigs]);

  const updateProviderConfig = (
    provider: string,
    updates: Partial<LocalProviderConfig>
  ) => {
    setProviderConfigs((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        ...updates,
      },
    }));
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "openai":
        return React.createElement(OpenAIIcon, { className: "w-5 h-5" });
      case "anthropic":
        return React.createElement(AnthropicIcon, { className: "w-5 h-5" });
      case "google":
        return React.createElement(GoogleIcon, { className: "w-5 h-5" });
      case "ollama":
        return React.createElement(OllamaIcon, { className: "w-5 h-5" });
      default:
        return React.createElement(Settings2, { className: "w-5 h-5" });
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case "openai":
        return "OpenAI";
      case "anthropic":
        return "Anthropic";
      case "google":
        return "Google";
      case "ollama":
        return "Ollama";
      default:
        return provider;
    }
  };

  // Group models by provider for display
  const modelsByProvider = Object.entries(MODELS);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Model Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Models by Provider */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modelsByProvider.map(([provider]) => {
              const providerConfig = providerConfigs[provider];
              const isProviderComplete =
                provider === "ollama"
                  ? !!providerConfig.baseUrl
                  : !!providerConfig.apiKey;

              return (
                <Card key={provider} className="transition-all duration-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getProviderIcon(provider)}
                        <div>
                          <CardTitle className="text-lg">
                            {getProviderName(provider)}
                          </CardTitle>
                          <CardDescription>
                            Configure provider settings
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-medium">
                        {isProviderComplete ? (
                          <>
                            <Check className="w-4 h-4 text-green-600" />
                            <span className="text-green-600">Ready</span>
                          </>
                        ) : (
                          <span className="text-gray-500">Setup Required</span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Provider-specific settings */}
                    {provider !== "ollama" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Key className="w-4 h-4 inline mr-1" />
                          API Key
                        </label>
                        <div className="relative">
                          <input
                            type={
                              apiKeyVisibility[provider] ? "text" : "password"
                            }
                            value={providerConfig.apiKey || ""}
                            onChange={(e) =>
                              updateProviderConfig(provider, {
                                apiKey: e.target.value,
                              })
                            }
                            placeholder={`Enter ${getProviderName(
                              provider
                            )} API key`}
                            className="w-full px-3 py-2 pr-10 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setApiKeyVisibility((prev) => ({
                                ...prev,
                                [provider]: !prev[provider],
                              }));
                            }}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {apiKeyVisibility[provider] ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {provider === "ollama" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {React.createElement(OllamaIcon, {
                            className: "w-4 h-4 inline mr-1",
                          })}
                          Base URL
                        </label>
                        <input
                          type="text"
                          value={
                            providerConfig.baseUrl || "http://localhost:11434"
                          }
                          onChange={(e) =>
                            updateProviderConfig(provider, {
                              baseUrl: e.target.value,
                            })
                          }
                          placeholder="http://localhost:11434"
                          className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {getProviderIdForModel(config.model) === "ollama"
              ? "Make sure Ollama is running locally"
              : "Your API keys are stored locally in your browser"}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
