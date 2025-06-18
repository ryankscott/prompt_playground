import React, { useState, useEffect } from "react";
import type { LLMProvider, LLMConfig, ProviderConfig } from "../types";
import { MODELS, getProviderForModel } from "../types";
import { storage } from "../utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Check,
  Key,
  Server,
  Zap,
  Settings2,
  Search,
  Asterisk,
  Eye,
  EyeOff,
} from "lucide-react";

interface SettingsPanelProps {
  config: LLMConfig;
  onConfigChange: (config: Partial<LLMConfig>) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  config,
  onConfigChange,
  isOpen,
  onClose,
}) => {
  // State to track API key visibility for each provider
  const [apiKeyVisibility, setApiKeyVisibility] = useState<
    Record<LLMProvider, boolean>
  >({
    openai: false,
    anthropic: false,
    google: false,
    ollama: false,
  });

  // Provider configs stored locally in the settings panel
  const [providerConfigs, setProviderConfigs] = useState<
    Record<LLMProvider, ProviderConfig>
  >(() => {
    const currentProvider = getProviderForModel(config.model);
    const storedConfigs = storage.getProviderConfigs();
    return {
      openai: {
        model: MODELS.openai[0]?.id || "gpt-4o-mini",
        apiKey:
          storedConfigs.openai?.apiKey ||
          (currentProvider === "openai" ? config.apiKey : undefined),
      },
      anthropic: {
        model: MODELS.anthropic[0]?.id || "claude-sonnet-4-20250514",
        apiKey:
          storedConfigs.anthropic?.apiKey ||
          (currentProvider === "anthropic" ? config.apiKey : undefined),
      },
      google: {
        model: MODELS.google[0]?.id || "gemini-2.0-flash",
        apiKey:
          storedConfigs.google?.apiKey ||
          (currentProvider === "google" ? config.apiKey : undefined),
      },
      ollama: {
        model: MODELS.ollama[0]?.id || "llama3.2",
        baseUrl:
          storedConfigs.ollama?.baseUrl ||
          (currentProvider === "ollama"
            ? config.baseUrl || "http://localhost:11434"
            : "http://localhost:11434"),
      },
    };
  });

  // Save provider configs to localStorage when they change
  useEffect(() => {
    storage.saveProviderConfigs(providerConfigs);
  }, [providerConfigs]);

  const updateProviderConfig = (
    provider: LLMProvider,
    updates: Partial<ProviderConfig>
  ) => {
    setProviderConfigs((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        ...updates,
      },
    }));
  };

  const updateCommonSettings = (updates: {
    temperature?: number;
    maxTokens?: number;
  }) => {
    onConfigChange(updates);
  };

  const getProviderIcon = (provider: LLMProvider) => {
    switch (provider) {
      case "openai":
        return <Zap className="w-5 h-5" />;
      case "anthropic":
        return <Asterisk className="w-5 h-5" />;
      case "google":
        return <Search className="w-5 h-5" />;
      case "ollama":
        return <Server className="w-5 h-5" />;
      default:
        return <Settings2 className="w-5 h-5" />;
    }
  };

  const getProviderName = (provider: LLMProvider) => {
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
  const modelsByProvider = Object.entries(MODELS) as [
    LLMProvider,
    (typeof MODELS)[LLMProvider]
  ][];

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
                          <Server className="w-4 h-4 inline mr-1" />
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

          {/* Common Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Model Parameters</CardTitle>
              <CardDescription>
                These settings apply to all models
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature: {config.temperature.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={config.temperature}
                  onChange={(e) =>
                    updateCommonSettings({
                      temperature: parseFloat(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Focused (0.0)</span>
                  <span>Balanced (1.0)</span>
                  <span>Creative (2.0)</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Tokens: {config.maxTokens}
                </label>
                <input
                  type="range"
                  min="100"
                  max="8000"
                  step="100"
                  value={config.maxTokens}
                  onChange={(e) =>
                    updateCommonSettings({
                      maxTokens: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {getProviderForModel(config.model) === "ollama"
              ? "Make sure Ollama is running locally"
              : "Your API keys are stored locally in your browser"}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
