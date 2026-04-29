import OpenAI from 'openai';
import type {ChatCompletionTool} from 'openai/resources/chat/completions';
import {config} from '../config';

type ChatCompletionMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export const SENTIMENT_TOOL_NAME = 'rate_user_sentiment';

const openai = new OpenAI({apiKey: config.OPENAI_API_KEY});

const sentimentTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: SENTIMENT_TOOL_NAME,
    description: 'Rates the user\'s current sentiment in this conversation.',
    strict: true,
    parameters: {
      type: 'object',
      properties: {
        sentiment: {
          type: 'integer',
          description: '0 is very negative, 50 is neutral, and 100 is very positive.',
        },
      },
      required: ['sentiment'],
      additionalProperties: false,
    },
  },
};

export async function createChatCompletion(messages: ChatCompletionMessage[]) {
  return openai.chat.completions.create({
    model: config.OPENAI_MODEL,
    messages,
  });
}

export async function createSentimentToolCallCompletion(messages: ChatCompletionMessage[]) {
  return openai.chat.completions.create({
    model: config.OPENAI_MODEL,
    messages,
    tools: [sentimentTool],
    tool_choice: {
      type: 'function',
      function: {name: SENTIMENT_TOOL_NAME},
    },
  });
}
