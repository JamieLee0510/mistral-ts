# Mistral Typescript Client

This repository is the typescript version of [mistralai/client-js](https://github.com/mistralai/client-js)

You can use the Mistral JavaScript/Typescript client to interact with the Mistral AI API.

## Usage

### Set up

```
import { MistralClient } from 'mistral-ts';

const apiKey = process.env.MISTRAL_API_KEY || 'your_api_key';

const client = new MistralClient(apiKey);
```

### List models

```
const listModelsResponse = await client.listModels();
const listModels = listModelsResponse.data;
listModels.forEach((model) => {
  console.log('Model:', model);
});
```

### Chat with streamimg

```
const chatStreamResponse = await client.chatStream({
  model: 'mistral-tiny',
  messages: [{role: 'user', content: 'What is the best French cheese?'}],
});

console.log('Chat Stream:');
for await (const chunk of chatStreamResponse) {
  if (chunk.choices[0].delta.content !== undefined) {
    const streamText = chunk.choices[0].delta.content;
    process.stdout.write(streamText);
  }
}
```

### Chat without streaming

```
const chatResponse = await client.chat({
  model: 'mistral-tiny',
  messages: [{role: 'user', content: 'What is the best French cheese?'}],
});

console.log('Chat:', chatResponse.choices[0].message.content);
```

### Embeddings

```
const input = [];
for (let i = 0; i < 1; i++) {
  input.push('What is the best French cheese?');
}

const embeddingsBatchResponse = await client.embeddings({
  model: 'mistral-embed',
  input: input,
});

console.log('Embeddings Batch:', embeddingsBatchResponse.data);
```

# ChangeLog

- 20240506---init the project from offical js version
