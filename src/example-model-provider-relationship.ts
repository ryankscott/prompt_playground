// Example demonstrating the explicit Model <-> LLMProvider relationship

import { MODELS, getProviderForModel, getModelInfo } from "./models";
import type { LLMProvider } from "./models";
import type { Model } from "./types";

// Example 1: Access provider information directly from a model
const gptModel: Model = MODELS.openai[0]; // GPT-4.1 Nano
const provider: LLMProvider = gptModel.provider;

console.log("Model:", gptModel.name);
console.log("Provider:", provider.name);
console.log("Provider Icon:", provider.icon);
console.log("Configuration fields needed:", provider.configFields);

// Example 2: Use helper functions to get provider info
const modelId = "claude-4-opus";
const modelInfo = getModelInfo(modelId);
const providerInfo = getProviderForModel(modelId);

if (modelInfo && providerInfo) {
  console.log(`${modelInfo.name} is provided by ${providerInfo.name}`);
  console.log(`Tool support: ${modelInfo.supportsTools}`);
  console.log(
    `Cost per 1M tokens: $${modelInfo.cost.input} input, $${modelInfo.cost.output} output`
  );
  console.log(
    `Provider requires: ${providerInfo.configFields
      .map((f) => f.name)
      .join(", ")}`
  );
}

// Example 3: Type safety - TypeScript ensures the provider is always an LLMProvider
function analyzeModel(model: Model) {
  // TypeScript knows that model.provider is of type LLMProvider
  const providerName = model.provider.name; // ✅ Type safe
  const configFields = model.provider.configFields; // ✅ Type safe

  return {
    modelName: model.name,
    providerName,
    requiresApiKey: configFields.some((field) => field.id === "apiKey"),
    requiresBaseUrl: configFields.some((field) => field.id === "baseUrl"),
  };
}

// Example usage
const analysis = analyzeModel(MODELS.anthropic[0]);
console.log("Analysis:", analysis);

export { analyzeModel };
