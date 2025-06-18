# Prompt Playground

A powerful and intuitive web application for testing and experimenting with AI language models. Built with React, TypeScript, and modern web technologies, Prompt Playground provides a comprehensive interface for interacting with multiple AI providers and comparing their responses.

## Features

### 🤖 Multi-Provider AI Support
- **OpenAI**: GPT-4o Mini, GPT-4.1 Mini, GPT-4.1 Nano, GPT-4.1
- **Anthropic**: Claude Sonnet 4, Claude 3.7 Sonnet, Claude 3.5 Haiku
- **Google**: Gemini 2.0 Flash, Gemini 2.5 Flash
- **Ollama**: Llama 3.2, Gemma 3 (local models)

### 💬 Dual Chat Interface
- **Standard Chat**: Interactive conversations with your chosen AI model
- **A/B Testing**: Side-by-side comparison of different models responding to the same prompts

### 📝 Prompt Management
- Create, edit, and organize custom prompt templates
- Import/export prompt libraries for sharing and backup
- System message integration for consistent AI behavior
- Collapsible sidebar for efficient workspace management

### ⚙️ Advanced Configuration
- Adjustable model parameters (temperature, max tokens)
- API key management for different providers
- Custom base URLs for self-hosted models (Ollama)
- Real-time model switching

### 📊 Detailed Analytics
- Token usage tracking (input, output, total)
- Response time monitoring
- Cost calculation per interaction
- Comprehensive metadata for each conversation

### 🎨 Modern User Experience
- Clean, responsive interface built with Tailwind CSS
- Markdown rendering with syntax highlighting
- Auto-resizing text inputs
- Real-time streaming responses
- Conversation management and clearing

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd prompt-playground
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Configuration

1. **API Keys**: Click the Settings gear icon to configure API keys for:
   - OpenAI (requires API key)
   - Anthropic (requires API key)
   - Google (requires API key)
   - Ollama (requires local installation and base URL)

2. **Local Models**: For Ollama, ensure you have it installed and running:
```bash
# Install Ollama (visit ollama.ai for instructions)
ollama pull llama3.2
ollama pull gemma3
```

## Usage

### Creating Prompts
1. Click "New Prompt" in the sidebar
2. Give your prompt a name and enter the system message content
3. Save to use across conversations

### Chat Mode
1. Select a prompt from the sidebar or start a new conversation
2. Choose your preferred AI model from the dropdown
3. Type your message and press Enter to send
4. View detailed metrics including tokens used, response time, and costs

### A/B Testing
1. Switch to the "A/B Test" tab
2. The interface automatically sets up two different models for comparison
3. Send a message to see responses from both models side-by-side
4. Perfect for comparing model capabilities, response styles, or prompt effectiveness

### Managing Conversations
- **Clear Conversation**: Reset chat while keeping the current prompt
- **New Conversation**: Start fresh without any prompt
- **Export/Import**: Save and share your prompt libraries

## Technology Stack

- **Frontend**: React 19 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives
- **Markdown**: react-markdown with GitHub Flavored Markdown
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Development**: ESLint, TypeScript compiler

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── ChatInterface.tsx
│   ├── ABTestInterface.tsx
│   ├── PromptSidebar.tsx
│   └── SettingsPanel.tsx
├── hooks/              # Custom React hooks
├── types.ts           # TypeScript type definitions
├── utils.ts           # Utility functions and API calls
└── App.tsx            # Main application component
```

## API Integration

The application integrates with multiple AI providers through their REST APIs:
- Streaming responses for real-time conversation
- Token usage tracking and cost calculation
- Error handling and fallback mechanisms
- Configurable request parameters

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with React and TypeScript
- UI components powered by Radix UI
- Styled with Tailwind CSS
- Markdown rendering by react-markdown
