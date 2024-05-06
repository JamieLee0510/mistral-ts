export interface Message {
  role: string;
  content: string;
}

export interface Tool {
  name: string;
  description: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: Message[];
  tools?: Tool[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  randomSeed?: number;
  stream?: boolean;
  safePrompt?: boolean;
  safeMode?: boolean;
  toolChoice?: string;
  responseFormat?: string;
}

export interface MistralChatCompletionRequest {
  model: string;
  messages: Message[];
  tools: Tool[];
  temperature: number;
  max_tokens: number;
  top_p: number;
  random_seed: number;
  stream: boolean;
  safe_prompt: boolean;
  tool_choice: string;
  response_format: string;
}
