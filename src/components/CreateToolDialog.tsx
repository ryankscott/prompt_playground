import React, { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import EmojiPicker, { Theme, EmojiStyle } from "emoji-picker-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import type { Tool, ParameterFormData } from "../types";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";

interface CreateToolDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTool: (
    name: string,
    description: string,
    parameters: ParameterFormData[],
    code: string,
    emoji?: string
  ) => void;
  onUpdateTool?: (
    id: string,
    name: string,
    description: string,
    parameters: ParameterFormData[],
    code: string,
    emoji?: string
  ) => void;
  editingTool?: Tool | null;
}

export const CreateToolDialog: React.FC<CreateToolDialogProps> = ({
  isOpen,
  onClose,
  onCreateTool,
  onUpdateTool,
  editingTool,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parameters, setParameters] = useState<ParameterFormData[]>([]);
  const [code, setCode] = useState("");
  const [emoji, setEmoji] = useState("");
  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false);

  const isEditing = !!editingTool;

  const onEmojiClick = (emojiObject: { emoji: string }) => {
    setEmoji(emojiObject.emoji);
    setIsEmojiPickerVisible(false);
  };

  useEffect(() => {
    if (editingTool) {
      setName(editingTool.function.name);
      setDescription(editingTool.function.description);
      setEmoji(editingTool.emoji || "");
      // Convert from new Tool format to form format
      const formParameters: ParameterFormData[] = Object.entries(
        editingTool.function.parameters.properties
      ).map(([paramName, paramDef]) => ({
        name: paramName,
        type: paramDef.type,
        description: paramDef.description,
        required: editingTool.function.parameters.required.includes(paramName),
        enum: paramDef.enum,
      }));
      setParameters(formParameters);
      setCode(editingTool.code);
    } else {
      setName("");
      setDescription("");
      setEmoji("");
      setParameters([]);
      setCode(`// Tool function - return the result
// Available: args (object with parameters), fetch (for HTTP requests)

async function execute(args) {
  // Your tool logic here
  return 'Hello from tool!';
}

return await execute(args);`);
    }
  }, [editingTool, isOpen]);

  const addParameter = () => {
    setParameters([
      ...parameters,
      {
        name: "",
        type: "string",
        description: "",
        required: true,
      },
    ]);
  };

  const updateParameter = (
    index: number,
    field: keyof ParameterFormData,
    value: string | boolean | string[]
  ) => {
    const updated = [...parameters];
    updated[index] = { ...updated[index], [field]: value as never };
    setParameters(updated);
  };

  const removeParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && description.trim() && code.trim()) {
      if (isEditing && onUpdateTool && editingTool) {
        onUpdateTool(
          editingTool.id,
          name.trim(),
          description.trim(),
          parameters,
          code.trim(),
          emoji.trim() || undefined
        );
      } else {
        onCreateTool(
          name.trim(),
          description.trim(),
          parameters,
          code.trim(),
          emoji.trim() || undefined
        );
      }
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Tool" : "Create New Tool"}
          </DialogTitle>
          <DialogDescription>
            Define a custom tool that can be called during conversations.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className=" ">
              <label className="text-sm font-medium">Name</label>
              <div
                onClick={() => setIsEmojiPickerVisible(!isEmojiPickerVisible)}
                className="
                  cursor-pointer
                  flex gap-2 w-full"
              >
                <div className="position-relative bg-gray-100 hover:bg-gray-200 rounded-md p-1 flex items-center justify-center min-h-12 min-w-12">
                  {emoji || "🔧"}
                </div>
                {isEmojiPickerVisible && (
                  <div className="absolute z-10 mt-1 left-4 top-40">
                    <EmojiPicker
                      onEmojiClick={onEmojiClick}
                      skinTonesDisabled={true}
                      theme={Theme.LIGHT}
                      emojiStyle={EmojiStyle.NATIVE}
                      searchPlaceHolder="Search emoji..."
                      width={320}
                      height={400}
                    />
                  </div>
                )}
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tool name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this tool do?"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Parameters</label>
              <Button
                type="button"
                variant="link"
                onClick={addParameter}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Plus size={16} />
                Add Parameter
              </Button>
            </div>

            <div className="space-y-3">
              {parameters.length === 0 && (
                <p className="text-sm text-gray-500 italic border border-dashed border-gray-300 p-4 text-center rounded-md">
                  No parameters defined. Add parameters if your tool needs input
                  data.
                </p>
              )}

              {parameters.map((param, index) => (
                <div
                  key={index}
                  className="p-3 border border-gray-200 rounded-md bg-gray-50"
                >
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium">
                        Parameter {index + 1}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeParameter(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Name */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        Name
                      </label>
                      <input
                        type="text"
                        value={param.name}
                        onChange={(e) =>
                          updateParameter(index, "name", e.target.value)
                        }
                        placeholder="Parameter name"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                        required
                      />
                    </div>

                    {/* Type */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">
                        Type
                      </label>
                      <select
                        value={param.type}
                        onChange={(e) =>
                          updateParameter(
                            index,
                            "type",
                            e.target.value as
                              | "string"
                              | "number"
                              | "boolean"
                              | "array"
                              | "object"
                          )
                        }
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="array">Array</option>
                        <option value="object">Object</option>
                      </select>
                    </div>

                    {/* Required */}
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`required-${index}`}
                        checked={param.required}
                        onChange={(e) =>
                          updateParameter(index, "required", e.target.checked)
                        }
                        className="rounded border-gray-300 mr-2"
                      />
                      <label
                        htmlFor={`required-${index}`}
                        className="text-xs text-gray-500"
                      >
                        Required
                      </label>
                    </div>

                    {/* Description - full width */}
                    <div className="md:col-span-3">
                      <label className="text-xs text-gray-500 mb-1 block">
                        Description
                      </label>
                      <input
                        type="text"
                        value={param.description}
                        onChange={(e) =>
                          updateParameter(index, "description", e.target.value)
                        }
                        placeholder="Parameter description"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                      />
                    </div>

                    {/* Enum values - only for string type */}
                    {param.type === "string" && (
                      <div className="md:col-span-3">
                        <label className="text-xs text-gray-500 mb-1 block">
                          Enum Values (Optional, comma-separated)
                        </label>
                        <input
                          type="text"
                          value={param.enum?.join(", ") || ""}
                          onChange={(e) =>
                            updateParameter(
                              index,
                              "enum",
                              e.target.value
                                ? e.target.value.split(",").map((v) => v.trim())
                                : []
                            )
                          }
                          placeholder="value1, value2, value3"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Code</label>
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="font-mono text-sm min-h-[200px]"
              required
            />
            <p className="text-xs text-gray-500">
              Write JavaScript code that will be executed when the tool is
              called.
              <br />
              Your code has access to the <code>args</code> object with
              parameter values and <code>fetch</code> for HTTP requests.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? "Save Changes" : "Create Tool"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
