# Prompt Playground: Vercel AI SDK Integration

This document explains how the Prompt Playground application integrates with the Vercel AI SDK.

## Overview

The Prompt Playground now uses the [Vercel AI SDK](https://ai-sdk.dev/) for all LLM interactions, including:

- Chat message streaming
- Tool/function calling
- Multi-model support

## Key Components

### API Layer

- `src/api/chat.ts` - Implements `createChatAPI` for streaming responses using AI SDK
- `src/api-plugin.ts` - Vite middleware for handling API requests during development
- `src/api/chat/route.ts` - Route handler that connects HTTP requests to the API

### State Management

- `src/hooks/usePlaygroundState.ts` - Custom hook that wraps `useChat` from the AI SDK
- Syncs AI SDK state with the application's conversation format
- Handles tool/function calling via the AI SDK

### Component Integration

- Components now support both legacy state management and AI SDK state
- `ChatInterface.tsx` can work with either local state or AI SDK props
- `TabbedChatInterface.tsx` passes AI SDK props to child components

### Model Configuration

- `src/models.ts` - Defines available models and their configuration
- Maps models to their respective providers (OpenAI, Anthropic, Google)

## How It Works

1. User inputs are captured by the AI SDK's `useChat` hook
2. Messages are streamed via the custom API endpoints
3. Tool calls are automatically detected and processed
4. State is synchronized between the AI SDK and our application

## Using the SDK

### In Components

Components can access AI SDK features through these props:

```typescript
// Direct AI SDK props
input: string;
handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
status: "submitted" | "streaming" | "ready" | "error";
reload: () => Promise<void>;
stop: () => void;
```

### API Options

The API supports these options:

```typescript
{
  messages: Message[]; // Uses AI SDK message format
  model: string;       // Model ID (e.g., "gpt-4", "claude-3-opus")
  temperature?: number;
  maxTokens?: number;
  tools?: Tool[];      // Optional tools for function calling
}
```

## Provider Support

The integration supports:

- OpenAI models (`gpt-3.5-turbo`, `gpt-4`, etc.)
- Anthropic models (`claude-3-opus`, `claude-3-sonnet`, etc.)
- Google models (`gemini-1.0-pro`, `gemini-1.5-pro`, etc.)

Each provider uses its respective package from the AI SDK:

- `@ai-sdk/openai`
- `@ai-sdk/anthropic`
- `@ai-sdk/google`
