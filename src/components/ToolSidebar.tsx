import React, { useState } from "react";
import {
  Wrench,
  Plus,
  Edit2,
  Trash2,
  Download,
  Upload,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import type { Tool } from "../types";
import { CreateToolDialog } from "./CreateToolDialog";
import { Button } from "./ui/button";

// Helper interface for form state
interface ParameterFormData {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  required: boolean;
  enum?: string[];
}

interface ToolSidebarProps {
  tools: Tool[];
  selectedToolIds: string[];
  onToggleTool: (toolId: string) => void;
  onCreateTool: (
    name: string,
    description: string,
    parameters: ParameterFormData[],
    code: string,
    emoji?: string
  ) => void;
  onUpdateTool: (
    id: string,
    name: string,
    description: string,
    parameters: ParameterFormData[],
    code: string,
    emoji?: string
  ) => void;
  onDeleteTool: (id: string) => void;
  onExportTools: () => void;
  onImportTools: () => Promise<number>;
  isCollapsed: boolean;
}

export const ToolSidebar: React.FC<ToolSidebarProps> = ({
  tools,
  selectedToolIds,
  onToggleTool,
  onCreateTool,
  onUpdateTool,
  onDeleteTool,
  onExportTools,
  onImportTools,
  isCollapsed,
}) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);

  const handleCreateTool = (
    name: string,
    description: string,
    parameters: ParameterFormData[],
    code: string,
    emoji?: string
  ) => {
    onCreateTool(name, description, parameters, code, emoji);
    setIsCreateDialogOpen(false);
  };

  const handleUpdateTool = (
    id: string,
    name: string,
    description: string,
    parameters: ParameterFormData[],
    code: string,
    emoji?: string
  ) => {
    onUpdateTool(id, name, description, parameters, code, emoji);
    setEditingTool(null);
  };

  const handleImportTools = async () => {
    try {
      const count = await onImportTools();
      toast.success(`Successfully imported ${count} tools`);
    } catch (error) {
      toast.error(
        `Import failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!isCollapsed ? (
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Wrench size={20} />
            Tools
          </h2>
        ) : (
          <div className="flex justify-center w-full">
            <Wrench size={20} className="text-gray-700" />
          </div>
        )}
      </div>

      {!isCollapsed ? (
        <>
          {/* Controls */}
          <div className="p-4 border-b border-gray-200 space-y-2">
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(true)}
              className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-800"
            >
              <Plus size={16} />
              New Tool
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onExportTools}
                className="flex-1 text-gray-600 hover:text-gray-800"
              >
                <Download size={12} />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleImportTools}
                className="flex-1 text-gray-600 hover:text-gray-800"
              >
                <Upload size={12} />
                Import
              </Button>
            </div>
          </div>

          {/* Tools List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {tools.length === 0 ? (
              <div className="text-center py-8">
                <Wrench size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500 mb-4">No tools yet</p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Create your first tool
                </Button>
              </div>
            ) : (
              tools.map((tool) => (
                <div
                  key={tool.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    selectedToolIds.includes(tool.id)
                      ? "bg-green-50 border-green-200"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onToggleTool(tool.id)}
                        className={`h-5 w-5 border-2 p-0 ${
                          selectedToolIds.includes(tool.id)
                            ? "bg-green-500 border-green-500 text-white hover:bg-green-600"
                            : "border-gray-300 hover:border-green-500"
                        }`}
                      >
                        {selectedToolIds.includes(tool.id) && (
                          <Check size={12} />
                        )}
                      </Button>
                      <span
                        className="text-xl flex-shrink-0 w-8 text-center"
                        title="Tool emoji"
                      >
                        {tool.emoji || "🔧"}
                      </span>
                      <h3 className="font-medium text-gray-900 text-sm">
                        {tool.function.name}
                      </h3>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingTool(tool)}
                        className="h-6 w-6 text-gray-400 hover:text-blue-600"
                      >
                        <Edit2 size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          toast.error(`Delete "${tool.function.name}"?`, {
                            action: {
                              label: "Delete",
                              onClick: () => {
                                onDeleteTool(tool.id);
                                toast.success(
                                  `"${tool.function.name}" deleted`
                                );
                              },
                            },
                          });
                        }}
                        className="h-6 w-6 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                    {tool.function.description}
                  </p>
                  <p className="text-xs text-gray-400">
                    {Object.keys(tool.function.parameters.properties).length}{" "}
                    parameter(s)
                  </p>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="py-4 flex flex-col items-center space-y-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCreateDialogOpen(true)}
            className="h-10 w-10 text-blue-600 hover:bg-blue-50"
            title="Create new tool"
          >
            <Plus size={20} />
          </Button>

          {/* Show tool emojis in collapsed view */}
          <div className="flex flex-col items-center space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto px-2 py-2">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => onToggleTool(tool.id)}
                className={`p-2 rounded-lg transition-colors relative ${
                  selectedToolIds.includes(tool.id)
                    ? "bg-green-100 text-green-700"
                    : "hover:bg-gray-100"
                }`}
                title={`${tool.function.name}${
                  selectedToolIds.includes(tool.id) ? " (selected)" : ""
                }`}
              >
                <span className="text-xl">{tool.emoji || "🔧"}</span>
                {selectedToolIds.includes(tool.id) && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                    <Check size={8} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <CreateToolDialog
        isOpen={isCreateDialogOpen || !!editingTool}
        onClose={() => {
          setIsCreateDialogOpen(false);
          setEditingTool(null);
        }}
        onCreateTool={handleCreateTool}
        onUpdateTool={handleUpdateTool}
        editingTool={editingTool}
      />
    </div>
  );
};
