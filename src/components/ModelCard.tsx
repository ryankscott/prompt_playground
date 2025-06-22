import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type { LLMConfig, Prompt } from "../types";
import { getModelInfo } from "../models";

interface ModelCardProps {
  config: LLMConfig;
  selectedPrompt?: Prompt | null;
}

export const ModelCard: React.FC<ModelCardProps> = ({
  config,
  selectedPrompt,
}) => {
  const currentModel = getModelInfo(config.model);

  return (
    <Card className="min-w-md">
      <CardHeader className="text-center pb-4">
        <CardTitle className="flex items-center justify-center gap-2">
          {currentModel?.provider.icon && <currentModel.provider.icon />}
          <span className="text-lg font-semibold text-gray-900">
            {currentModel?.provider.name}
          </span>
          <span className="text-gray-400">/</span>
          <span className="text-lg font-semibold text-gray-900">
            {currentModel?.name}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Model details */}
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Context</span>
            <span className="font-medium">
              {config.maxTokens?.toLocaleString()} tokens
            </span>
          </div>
          <div className="flex justify-between">
            <span>Input Pricing</span>
            <span className="font-medium">
              ${currentModel?.cost?.input || 0} / million tokens
            </span>
          </div>
          <div className="flex justify-between">
            <span>Output Pricing</span>
            <span className="font-medium">
              ${currentModel?.cost?.output || 0} / million tokens
            </span>
          </div>
          <div className="flex justify-between">
            <span>Tools Support</span>
            <span className="font-medium">
              {currentModel?.supportsTools ? "Yes" : "No"}
            </span>
          </div>
        </div>

        {selectedPrompt && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-blue-900 mb-1">
              Selected Prompt
            </div>
            <div className="text-sm text-blue-800">{selectedPrompt.name}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
