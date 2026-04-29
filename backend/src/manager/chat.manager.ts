import {z} from 'zod';
import type {
  ChatCompletionMessageFunctionToolCall,
  ChatCompletionMessageToolCall,
} from 'openai/resources/chat/completions';
import {ChatMessage} from '../schema/chat.schema';
import {
  createChatCompletion,
  createSentimentToolCallCompletion,
  SENTIMENT_TOOL_NAME,
} from '../service/openai.service';
import {ensureFreshEmojiSignature, getUsedSignatureEmojis} from './emojiSignature';

type AgentChatMessage = {
  id: string;
  role: 'agent';
  content: string;
};

const sentimentToolArgumentsSchema = z.object({
  sentiment: z.number().int().min(0).max(100),
});

function buildSystemPrompt(usedEmojis: Set<string>): string {
  const usedEmojiList = Array.from(usedEmojis).join(' ');

  return [
    'You are a helpful AI chat bot.',
    'Answer the user naturally and concisely.',
    'Sign every message by ending it with exactly one emoji.',
    'The signing emoji must be different from every signing emoji already used in this conversation.',
    usedEmojiList ? `Already used signing emojis: ${usedEmojiList}` : 'No signing emojis have been used yet.',
    'Do not write anything after the signing emoji.',
  ].join(' ');
}

function buildSentimentPrompt(): string {
  return [
    'Rate the user\'s current sentiment in this conversation.',
    'Use the full conversation as context, but weigh the latest user message most heavily.',
    'Call the sentiment rating function with an integer from 0 to 100.',
    '0 means very negative, 50 means neutral, and 100 means very positive.',
  ].join(' ');
}

function toOpenAiMessages(messages: ChatMessage[]) {
  return messages.map((message) => ({
    role: message.role === 'user' ? 'user' as const : 'assistant' as const,
    content: message.content,
  }));
}

function getLatestUserMessageId(messages: ChatMessage[]): string | undefined {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === 'user') {
      return messages[index]?.id;
    }
  }

  return undefined;
}

function isSentimentToolCall(
  call: ChatCompletionMessageToolCall
): call is ChatCompletionMessageFunctionToolCall {
  if (call.type !== 'function') {
    return false;
  }

  return call.function.name === SENTIMENT_TOOL_NAME;
}

export async function createAgentChatMessage(messages: ChatMessage[]): Promise<AgentChatMessage | undefined> {
  const usedEmojis = getUsedSignatureEmojis(messages);

  const completion = await createChatCompletion([
    {role: 'system', content: buildSystemPrompt(usedEmojis)},
    ...toOpenAiMessages(messages),
  ]);

  const content = completion.choices[0]?.message.content;
  if (!content) {
    return undefined;
  }

  return {
    id: completion.id,
    role: 'agent',
    content: ensureFreshEmojiSignature(content, usedEmojis),
  };
}

export async function logUserSentiment(messages: ChatMessage[]): Promise<void> {
  const completion = await createSentimentToolCallCompletion([
    {role: 'system', content: buildSentimentPrompt()},
    ...toOpenAiMessages(messages),
  ]);

  const toolCall = completion.choices[0]?.message.tool_calls?.find(isSentimentToolCall);

  if (!toolCall) {
    throw new Error('OpenAI did not return a sentiment function call');
  }

  const args = sentimentToolArgumentsSchema.parse(JSON.parse(toolCall.function.arguments));
  const latestUserMessageId = getLatestUserMessageId(messages);
  const messageDetails = latestUserMessageId ? ` for message ${latestUserMessageId}` : '';

  console.log(`User sentiment${messageDetails}: ${args.sentiment}/100`);
}
