import { createChatAPI } from "../../api";
import { LanguageModelV1 } from "ai";
import type { Message, Tool } from "../../types";

interface ChatRequestBody {
  messages: Message[];
  model?: string;
  selectedModel: LanguageModelV1;
  temperature: number;
  maxTokens: number;
  tools?: Tool[];
}

export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    const body = (await req.json()) as ChatRequestBody;
    const { messages, model, selectedModel, temperature, maxTokens, tools } =
      body;

    console.log(
      `🚀 Chat API called with model: ${model || "custom"}, tools: ${
        tools?.length || 0
      }`
    );
    console.log(`🔧 Tools structure:`, JSON.stringify(tools, null, 2));
    console.log(`📝 Messages:`, JSON.stringify(messages, null, 2));

    // Create chat stream using our API
    const result = await createChatAPI({
      messages,
      model,
      selectedModel,
      temperature,
      maxTokens,
      tools,
    });

    console.log(`🔧 AI SDK result type:`, typeof result);
    console.log(`🔧 AI SDK result keys:`, Object.keys(result));

    // Calculate timing
    const timeTaken = Date.now() - startTime;

    // Add timing as custom header
    const response = result.toDataStreamResponse({
      // Include usage information
      sendUsage: true,
    });

    // Add timing metadata as custom header
    response.headers.set("X-Time-Taken", timeTaken.toString());

    console.log(`✅ Chat API completed in ${timeTaken}ms`);
    return response;
  } catch (error) {
    console.error("❌ Chat API error:", error);

    // Log more details about the error
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
