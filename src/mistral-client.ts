import { ChatCompletionRequest, MistralChatCompletionRequest } from './utils/type';
import { MistralAPIError } from './utils/api-error';
import { initializeFetch, isNode } from './utils/init-fetch';

const VERSION = '0.0.3';
const RETRY_STATUS_CODES = [429, 500, 502, 503, 504];
const ENDPOINT = 'https://api.mistral.ai';

export default class MistralClient {
  private apiKey: string;
  private endpoint: string;
  private maxRetries: number;
  private timeout: number;
  private modelDefault?: string;

  constructor(apiKey = process.env.MISTRAL_API_KEY!, endpoint = ENDPOINT, maxRetries = 5, timeout = 120) {
    this.apiKey = apiKey;
    this.endpoint = endpoint;
    this.maxRetries = maxRetries;
    this.timeout = timeout;
    if (this.endpoint.includes('inference.azure.com')) {
      this.modelDefault = 'mistral';
    }
    initializeFetch();
  }

  private _makeChatCompletionRequest({
    model,
    messages,
    tools,
    temperature,
    maxTokens,
    topP,
    randomSeed,
    stream,
    safeMode,
    safePrompt,
    toolChoice,
    responseFormat,
  }: any) {
    // if modelDefault and model are undefined, throw an error
    if (!model && !this.modelDefault) {
      throw new MistralAPIError('You must provide a model name');
    }
    return {
      model: model ?? this.modelDefault,
      messages: messages,
      tools: tools ?? undefined,
      temperature: temperature ?? undefined,
      max_tokens: maxTokens ?? undefined,
      top_p: topP ?? undefined,
      random_seed: randomSeed ?? undefined,
      stream: stream ?? undefined,
      safe_prompt: (safeMode || safePrompt) ?? undefined,
      tool_choice: toolChoice ?? undefined,
      response_format: responseFormat ?? undefined,
    } as MistralChatCompletionRequest;
  }

  private async _request(method: string, path: string, request?: any): Promise<any> {
    const url = `${this.endpoint}/${path}`;
    const options: RequestInit = {
      method,
      headers: {
        'User-Agent': `mistral-client-js/${VERSION}`,
        Accept: request?.stream ? 'text/event-stream' : 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: method !== 'get' ? JSON.stringify(request) : null,
      signal: AbortSignal.timeout(this.timeout * 1000),
    };

    for (let attempts = 0; attempts < this.maxRetries; attempts++) {
      try {
        const response = await fetch(url, options);
        if (response.ok) {
          if (request?.stream) {
            if (isNode) {
              return response.body;
            } else {
              const reader = response.body!.getReader();
              // Chrome does not support async iterators yet, so polyfill it
              const asyncIterator = async function* () {
                try {
                  while (true) {
                    // Read from the stream
                    const { done, value } = await reader.read();
                    // Exit if we're done
                    if (done) return;
                    // Else yield the chunk
                    yield value;
                  }
                } finally {
                  reader.releaseLock();
                }
              };

              return asyncIterator();
            }
          }
          return await response.json();
        } else if (RETRY_STATUS_CODES.includes(response.status)) {
          console.debug(`Retrying request on response status: ${response.status}`);
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempts + 1) * 500));
        } else {
          throw new MistralAPIError(`HTTP error! status: ${response.status}`);
        }
      } catch (error: any) {
        console.error(`Request failed: ${error.message}`);
        if (attempts === this.maxRetries - 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempts + 1) * 500));
      }
    }
    throw new Error('Max retries reached');
  }

  async listModels(): Promise<any> {
    return await this._request('get', 'v1/models');
  }

  async chat(request: ChatCompletionRequest): Promise<any> {
    const mistralRequest = this._makeChatCompletionRequest(request);
    return await this._request('post', 'v1/chat/completions', mistralRequest);
  }

  async *chatStream(request: ChatCompletionRequest): AsyncGenerator<any, void, undefined> {
    const mistralRequest = this._makeChatCompletionRequest({ ...request, stream: true });
    console.log('mistralRequest:', mistralRequest);
    const response = await this._request('post', 'v1/chat/completions', mistralRequest);
    console.log('---chatStream response:', response);
    let buffer = '';
    const decoder = new TextDecoder();
    for await (const chunk of response) {
      buffer += decoder.decode(chunk, { stream: true });
      let firstNewline;
      while ((firstNewline = buffer.indexOf('\n')) !== -1) {
        const chunkLine = buffer.substring(0, firstNewline);
        buffer = buffer.substring(firstNewline + 1);
        if (chunkLine.startsWith('data:')) {
          const json = chunkLine.substring(6).trim();
          if (json !== '[DONE]') {
            yield JSON.parse(json);
          }
        }
      }
    }
  }

  async embeddings({ model, input }: { model: string; input: string }) {
    const request = {
      model: model,
      input: input,
    };
    const response = await this._request('post', 'v1/embeddings', request);
    return response;
  }
}
