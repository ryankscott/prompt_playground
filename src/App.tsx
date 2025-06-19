import { useState } from "react";
import { SidebarWrapper } from "./components/SidebarWrapper";
import { SidebarContent } from "./components/SidebarContent";
import { TabbedChatInterface } from "./components/TabbedChatInterface";
import { SettingsPanel } from "./components/SettingsPanel";
import { usePlaygroundState } from "./hooks/usePlaygroundState";
import { Toaster } from "./components/ui/sonner";

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<"prompts" | "tools">(
    "prompts"
  );

  const {
    prompts,
    selectedPrompt,
    conversation,
    config,
    isLoading,
    error,
    tools,
    selectedToolIds,
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
    createTool,
    updateTool,
    deleteTool,
    toggleTool,
    exportTools,
    importTools,
  } = usePlaygroundState();

  return (
    <div className="h-screen flex bg-gray-100">
      <SidebarWrapper>
        <SidebarContent
          currentView={currentView}
          setCurrentView={setCurrentView}
          prompts={prompts}
          selectedPrompt={selectedPrompt}
          selectPrompt={selectPrompt}
          createPrompt={createPrompt}
          updatePrompt={updatePrompt}
          deletePrompt={deletePrompt}
          exportPrompts={exportPrompts}
          importPrompts={importPrompts}
          startNewConversation={startNewConversation}
          tools={tools}
          selectedToolIds={selectedToolIds}
          toggleTool={toggleTool}
          createTool={createTool}
          updateTool={updateTool}
          deleteTool={deleteTool}
          exportTools={exportTools}
          importTools={importTools}
        />
      </SidebarWrapper>

      <div className="flex-1 flex flex-col">
        <TabbedChatInterface
          messages={conversation.messages}
          onSendMessage={sendMessage}
          isLoading={isLoading}
          error={error}
          config={config}
          selectedPrompt={selectedPrompt}
          selectedTools={tools.filter((tool) =>
            selectedToolIds.includes(tool.id)
          )}
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
      <Toaster />
    </div>
  );
}

export default App;
