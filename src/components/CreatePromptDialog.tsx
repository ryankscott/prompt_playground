import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface CreatePromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePrompt: (name: string, content: string) => void;
  onUpdatePrompt?: (id: string, name: string, content: string) => void;
  editingPrompt?: { id: string; name: string; content: string } | null;
}

export const CreatePromptDialog: React.FC<CreatePromptDialogProps> = ({
  isOpen,
  onClose,
  onCreatePrompt,
  onUpdatePrompt,
  editingPrompt,
}) => {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");

  const isEditing = !!editingPrompt;

  // Set initial values when editing
  React.useEffect(() => {
    if (editingPrompt) {
      setName(editingPrompt.name);
      setContent(editingPrompt.content);
    } else {
      setName("");
      setContent("");
    }
  }, [editingPrompt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && content.trim()) {
      if (isEditing && onUpdatePrompt && editingPrompt) {
        onUpdatePrompt(editingPrompt.id, name.trim(), content.trim());
      } else {
        onCreatePrompt(name.trim(), content.trim());
      }
      setName("");
      setContent("");
      onClose();
    }
  };

  const handleClose = () => {
    setName("");
    setContent("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Prompt" : "Create New Prompt"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your prompt template."
              : "Create a new prompt template that you can use for your conversations."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="prompt-name"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Name
            </label>
            <input
              id="prompt-name"
              type="text"
              placeholder="Enter prompt name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              required
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="prompt-content"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Content
            </label>
            <textarea
              id="prompt-content"
              placeholder="Enter your prompt content..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              rows={6}
              required
            />
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
            >
              {isEditing ? "Update Prompt" : "Create Prompt"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
