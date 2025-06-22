// Script to import example tools into localStorage for testing
import fs from "fs";

// Read the example tools
const exampleTools = JSON.parse(
  fs.readFileSync("./example-tools.json", "utf-8")
);

// Load the tools into localStorage
const TOOLS_KEY = "playground_tools";

// Transform the example tools to match the expected format
const transformedTools = exampleTools.map((tool) => ({
  ...tool,
  createdAt: new Date(tool.createdAt).toISOString(),
  updatedAt: new Date(tool.updatedAt).toISOString(),
}));

// Save to localStorage (this would normally be done in the browser)
console.log("Example tools:", JSON.stringify(transformedTools, null, 2));

// For testing, let's also create a simple test command
console.log("To import these tools in the browser console, run:");
console.log(
  `localStorage.setItem('${TOOLS_KEY}', '${JSON.stringify(
    transformedTools
  ).replace(/'/g, "\\'")}');`
);
console.log("Then refresh the page.");
