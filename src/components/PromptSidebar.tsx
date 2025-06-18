import React, { useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Download,
  Upload,
  MessageSquarePlus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Prompt } from "../types";
import { CreatePromptDialog } from "./CreatePromptDialog";

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
  onToggleCollapse: () => void;
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
  onToggleCollapse,
}) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<{
    id: string;
    name: string;
    content: string;
  } | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

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
      setImportStatus(null);
      const importedCount = await onImportPrompts();
      setImportStatus(`Successfully imported ${importedCount} prompts`);
      setTimeout(() => setImportStatus(null), 3000);
    } catch (error) {
      setImportStatus(
        `Import failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setTimeout(() => setImportStatus(null), 5000);
    }
  };

  return (
    <div
      className={`bg-gray-50 border-r border-gray-200 flex flex-col h-full transition-all duration-200 ${
        isCollapsed ? "w-12" : "w-80"
      }`}
    >
      {/* Toggle button */}
      <div className="absolute top-4 -right-3 z-10">
        <button
          onClick={onToggleCollapse}
          className="p-1.5 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 transition-colors"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {!isCollapsed ? (
        <>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Prompts</h2>
            </div>

            {/* Start New Conversation button */}
            <div className="mb-3">
              <button
                onClick={onStartNewConversation}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 hover:border-blue-300"
                title="Start a new conversation without a prompt"
              >
                <MessageSquarePlus size={16} />
                New Conversation
              </button>
            </div>

            {/* Create new prompt button */}
            <div className="mb-3">
              <button
                onClick={() => setIsCreateDialogOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 hover:border-blue-300"
                title="Create new prompt"
              >
                <Plus size={16} />
                New Prompt
              </button>
            </div>

            {/* Import/Export buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleImport}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Import prompts from file"
              >
                <Upload size={16} />
                Import
              </button>
              <button
                onClick={handleExport}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Export prompts to file"
                disabled={prompts.length === 0}
              >
                <Download size={16} />
                Export
              </button>
            </div>

            {/* Status message */}
            {importStatus && (
              <div
                className={`mt-2 p-2 rounded text-xs ${
                  importStatus.includes("failed") ||
                  importStatus.includes("Import failed")
                    ? "bg-red-50 text-red-800 border border-red-200"
                    : "bg-green-50 text-green-800 border border-green-200"
                }`}
              >
                {importStatus}
              </div>
            )}
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(prompt);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePrompt(prompt.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
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
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Create new prompt"
          >
            <Plus size={20} />
          </button>
          <button
            onClick={onStartNewConversation}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Start a new conversation without a prompt"
          >
            <MessageSquarePlus size={20} />
          </button>
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
