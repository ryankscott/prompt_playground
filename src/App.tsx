import { useState } from "react";
import { PromptSidebar } from "./components/PromptSidebar";
import { TabbedChatInterface } from "./components/TabbedChatInterface";
import { SettingsPanel } from "./components/SettingsPanel";
import { usePlaygroundState } from "./hooks/usePlaygroundState";

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const {
    prompts,
    selectedPrompt,
    conversation,
    config,
    isLoading,
    error,
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
  } = usePlaygroundState();

  return (
    <div className="h-screen flex bg-gray-100">
      <div className="relative">
        <PromptSidebar
          prompts={prompts}
          selectedPromptId={selectedPrompt?.id}
          onSelectPrompt={selectPrompt}
          onCreatePrompt={createPrompt}
          onUpdatePrompt={updatePrompt}
          onDeletePrompt={deletePrompt}
          onExportPrompts={exportPrompts}
          onImportPrompts={importPrompts}
          onStartNewConversation={startNewConversation}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      <div className="flex-1 flex flex-col">
        <TabbedChatInterface
          messages={conversation.messages}
          onSendMessage={sendMessage}
          isLoading={isLoading}
          error={error}
          config={config}
          selectedPrompt={selectedPrompt}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onClearConversation={clearConversation}
          onStartNewConversation={startNewConversation}
          onModelChange={updateModel}
        />
      </div>

      <SettingsPanel
        config={config}
        onConfigChange={updateConfig}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

export default App;
