import React, { useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Download,
  Upload,
  MessageSquarePlus,
} from "lucide-react";
import { toast } from "sonner";
import type { Prompt } from "../types";
import { CreatePromptDialog } from "./CreatePromptDialog";
import { Button } from "./ui/button";

interface PromptSidebarProps {
  prompts: Prompt[];
  selectedPromptId?: string;
  onSelectPrompt: (prompt: Prompt) => void;
  onCreatePrompt: (name: string, content: string) => void;
  onUpdatePrompt: (id: string, name: string, content: string) => void;
  onDeletePrompt: (id: string) => void;
  onExportPrompts: () => void;
  onImportPrompts: () => Promise<number>;
  onStartNewConversation: () => void;
  isCollapsed: boolean;
}

export const PromptSidebar: React.FC<PromptSidebarProps> = ({
  prompts,
  selectedPromptId,
  onSelectPrompt,
  onCreatePrompt,
  onUpdatePrompt,
  onDeletePrompt,
  onExportPrompts,
  onImportPrompts,
  onStartNewConversation,
  isCollapsed,
}) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<{
    id: string;
    name: string;
    content: string;
  } | null>(null);

  const handleCreatePrompt = (name: string, content: string) => {
    onCreatePrompt(name, content);
    setIsCreateDialogOpen(false);
  };

  const handleUpdatePrompt = (id: string, name: string, content: string) => {
    onUpdatePrompt(id, name, content);
    setEditingPrompt(null);
  };

  const startEditing = (prompt: Prompt) => {
    setEditingPrompt({
      id: prompt.id,
      name: prompt.name,
      content: prompt.content,
    });
  };

  const closeDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingPrompt(null);
  };

  const handleExport = () => {
    onExportPrompts();
  };

  const handleImport = async () => {
    try {
      const importedCount = await onImportPrompts();
      toast.success(`Successfully imported ${importedCount} prompts`);
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
      {!isCollapsed ? (
        <>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Prompts</h2>
            </div>

            {/* Start New Conversation button */}
            <div className="mb-3">
              <Button
                onClick={onStartNewConversation}
                variant="outline"
                className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-800"
                title="Start a new conversation without a prompt"
              >
                <MessageSquarePlus size={16} />
                New Conversation
              </Button>
            </div>

            {/* Create new prompt button */}
            <div className="mb-3">
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                variant="outline"
                className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-800"
                title="Create new prompt"
              >
                <Plus size={16} />
                New Prompt
              </Button>
            </div>

            {/* Import/Export buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleImport}
                variant="outline"
                size="sm"
                className="flex-1 text-gray-600 hover:text-gray-900"
                title="Import prompts from file"
              >
                <Upload size={16} />
                Import
              </Button>
              <Button
                onClick={handleExport}
                variant="outline"
                size="sm"
                className="flex-1 text-gray-600 hover:text-gray-900"
                title="Export prompts to file"
                disabled={prompts.length === 0}
              >
                <Download size={16} />
                Export
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {prompts.map((prompt) => (
              <div
                key={prompt.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedPromptId === prompt.id
                    ? "bg-blue-50 border-blue-200"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
                onClick={() => onSelectPrompt(prompt)}
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-gray-900 text-sm truncate">
                    {prompt.name}
                  </h3>
                  <div className="flex gap-1">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(prompt);
                      }}
                      variant="ghost"
                      size="icon"
                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Edit2 size={14} />
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePrompt(prompt.id);
                      }}
                      variant="ghost"
                      size="icon"
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {prompt.content}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(prompt.updatedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </>
      ) : (
        // Collapsed state - show only essential items
        <div className="p-2 flex flex-col items-center space-y-3 mt-12">
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            variant="ghost"
            size="icon"
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Create new prompt"
          >
            <Plus size={20} />
          </Button>
          <Button
            onClick={onStartNewConversation}
            variant="ghost"
            size="icon"
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Start a new conversation without a prompt"
          >
            <MessageSquarePlus size={20} />
          </Button>
          {prompts.length > 0 && (
            <div className="text-xs text-gray-500 text-center">
              {prompts.length}
            </div>
          )}
        </div>
      )}

      <CreatePromptDialog
        isOpen={isCreateDialogOpen || !!editingPrompt}
        onClose={closeDialog}
        onCreatePrompt={handleCreatePrompt}
        onUpdatePrompt={handleUpdatePrompt}
        editingPrompt={editingPrompt}
      />
    </div>
  );
};
