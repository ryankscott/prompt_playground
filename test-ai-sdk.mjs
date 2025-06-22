#!/usr/bin/env node

/**
 * Test script for the Prompt Playground + Vercel AI SDK integration
 *
 * This script helps verify that the Vercel AI SDK integration is working correctly
 * by making test API calls and validating the responses.
 */

import { createChatAPI } from "./src/api";

async function testChat() {
  console.log("Testing Vercel AI SDK integration...");

  try {
    // Test OpenAI
    console.log("\n--- Testing OpenAI ---");
    const openaiStream = await createChatAPI({
      messages: [
        {
          role: "user",
          content: "Say hello and identify yourself as an AI assistant",
        },
      ],
      model: "gpt-3.5-turbo",
      temperature: 0.5,
      maxTokens: 100,
    });

    for await (const chunk of openaiStream) {
      if (chunk.type === "text-delta") {
        process.stdout.write(chunk.textDelta);
      }
    }

    // Test with tool calling
    console.log("\n\n--- Testing Tool Calling ---");
    const toolStream = await createChatAPI({
      messages: [{ role: "user", content: "What is the weather in New York?" }],
      model: "gpt-4",
      tools: [
        {
          id: "weather-tool",
          type: "function",
          function: {
            name: "get_weather",
            description: "Get the current weather for a location",
            parameters: {
              type: "object",
              properties: {
                location: {
                  type: "string",
                  description: "The city and state, e.g. San Francisco, CA",
                },
              },
              required: ["location"],
            },
          },
          code: "async function get_weather(args) { return { temperature: 72, conditions: 'Sunny' }; }",
        },
      ],
    });

    console.log("\nTool calling response:");
    for await (const chunk of toolStream) {
      if (chunk.type === "text-delta") {
        process.stdout.write(chunk.textDelta);
      } else if (chunk.type === "tool-invocation") {
        console.log(
          "\n\nTool Invocation:",
          JSON.stringify(chunk.toolInvocation, null, 2)
        );
      }
    }

    console.log("\n\nVercel AI SDK integration test complete!");
  } catch (error) {
    console.error("Error testing Vercel AI SDK integration:", error);
  }
}

testChat();
