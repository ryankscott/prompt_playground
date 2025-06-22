import { useState, useEffect } from "react";
import { SidebarWrapper } from "./components/SidebarWrapper";
import { SidebarContent } from "./components/SidebarContent";
import { MultiPanelPlayground } from "./components/MultiPanelPlayground";
import { SettingsPanel } from "./components/SettingsPanel";
import { usePlaygroundState } from "./hooks/usePlaygroundState";
import { Toaster } from "./components/ui/sonner";
import type { Message } from "./types";

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<"prompts" | "tools">(
    "prompts"
  );
  const [messageStartTimes, setMessageStartTimes] = useState<
    Record<string, number>
  >({});

  const {
    prompts,
    selectedPrompt,
    config,
    tools,
    selectedToolIds,
    // AI SDK direct access
    aiMessages,
    input,
    handleInputChange,
    handleSubmit,
    aiStatus,
    reload,
    stop,
    // Actions
    createPrompt,
    updatePrompt,
    deletePrompt,
    selectPrompt,
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

  // Track when messages start streaming to calculate timing
  useEffect(() => {
    if (aiStatus === "streaming") {
      const lastMessage = aiMessages[aiMessages.length - 1];

      if (
        lastMessage &&
        lastMessage.role === "assistant" &&
        !messageStartTimes[lastMessage.id]
      ) {
        setMessageStartTimes((prev) => ({
          ...prev,
          [lastMessage.id]: Date.now(),
        }));
      }
    }
  }, [aiStatus, aiMessages, messageStartTimes]);

  // Track when AI messages change for debugging
  useEffect(() => {
    console.log("🔍 AI messages changed:", aiMessages.length, "messages");
    console.log("🔍 AI status:", aiStatus);
    if (aiMessages.length > 0) {
      const lastMessage = aiMessages[aiMessages.length - 1];
      console.log("🔍 Last message:", lastMessage);
    }
  }, [aiMessages, aiStatus]);

  // Convert AI SDK messages to our Message format
  const convertAiMessages = (aiMsgs: typeof aiMessages): Message[] => {
    return aiMsgs.map((aiMsg) => {
      // Basic message properties
      const message: Message = {
        id: aiMsg.id,
        role: aiMsg.role as "user" | "assistant" | "system" | "tool",
        content: aiMsg.content,
        timestamp: new Date(),
      };

      // Add timing to metadata if available
      if (
        aiMsg.role === "assistant" &&
        messageStartTimes[aiMsg.id] &&
        aiStatus !== "streaming"
      ) {
        const timeTaken = Date.now() - messageStartTimes[aiMsg.id];
        message.metadata = {
          ...message.metadata,
          timeTaken,
        };
      }

      // Extract tool invocations from AI SDK message
      // The AI SDK stores tool invocations in different properties depending on the version
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const msgWithToolInvocations = aiMsg as any;

      // Check for toolInvocations (newer AI SDK versions)
      if (msgWithToolInvocations?.toolInvocations?.length > 0) {
        message.role = "tool";
        message.content = msgWithToolInvocations?.toolInvocations?.[0].result;
      }

      return message;
    });
  };

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
        <MultiPanelPlayground
          selectedPrompt={selectedPrompt}
          selectedTools={tools.filter((tool) =>
            selectedToolIds.includes(tool.id)
          )}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onClearConversation={clearConversation}
          onStartNewConversation={startNewConversation}
          onModelChange={updateModel}
          onConfigChange={updateConfig}
          config={config}
          // Pass AI SDK props
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          status={aiStatus}
          reload={async () => {
            await reload();
          }}
          stop={stop}
          aiMessages={convertAiMessages(aiMessages)}
        />
      </div>

      <SettingsPanel
        config={config}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <Toaster />
    </div>
  );
}

export default App;
