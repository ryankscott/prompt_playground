import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { Settings } from "lucide-react";
import { MODELS } from "../models";
import type { LLMConfig } from "../types";

interface ModelSelectorProps {
  config: LLMConfig;
  onModelChange?: (model: string) => void;
  onOpenSettings: () => void;
  size?: "sm" | "default";
  showSettings?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  config,
  onModelChange,
  onOpenSettings,
  size = "default",
  showSettings = true,
}) => {
  return (
    <div className="flex items-center gap-2">
      <Select value={config.model} onValueChange={onModelChange}>
        <SelectTrigger
          className={size === "sm" ? "h-8 text-xs" : "h-9 text-sm"}
        >
          <SelectValue placeholder="Select model" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(MODELS).map(([, models]) =>
            models.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.provider.icon && <model.provider.icon />}
                {model.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {showSettings && (
        <Button
          variant="ghost"
          size={size === "sm" ? "sm" : "icon"}
          onClick={onOpenSettings}
          className="flex-shrink-0"
        >
          <Settings size={size === "sm" ? 14 : 18} />
        </Button>
      )}
    </div>
  );
};
