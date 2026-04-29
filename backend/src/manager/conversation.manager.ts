import {randomUUID} from 'crypto';
import {ChatMessage} from '../schema/chat.schema';
import {
  AddMessageResult,
  Conversation,
  ConversationsJson,
  ConversationSummary,
} from '../schema/conversation.schema';
import {createAgentChatMessage, logUserSentiment} from './chat.manager';

const conversationsJson: ConversationsJson = {
  conversations: {},
};

function nowIso(): string {
  return new Date().toISOString();
}

function createTitle(content: string): string {
  const maxLength = 40;
  const normalized = content.replace(/\s+/g, ' ').trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3)}...`;
}

function toSummary(conversation: Conversation): ConversationSummary {
  const lastMessage = conversation.messages.at(-1);

  return {
    id: conversation.id,
    title: conversation.title,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    messageCount: conversation.messages.length,
    lastMessagePreview: lastMessage?.content ?? '',
  };
}

export function listConversations(): ConversationSummary[] {
  return Object.values(conversationsJson.conversations)
    .map(toSummary)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function createConversation(): Conversation {
  const createdAt = nowIso();
  const conversation: Conversation = {
    id: randomUUID(),
    title: 'New conversation',
    messages: [],
    createdAt,
    updatedAt: createdAt,
  };

  conversationsJson.conversations[conversation.id] = conversation;

  return conversation;
}

export function getConversation(conversationId: string): Conversation | undefined {
  return conversationsJson.conversations[conversationId];
}

export async function addMessageToConversation(
  conversationId: string,
  content: string
): Promise<AddMessageResult | undefined> {
  const conversation = getConversation(conversationId);

  if (!conversation) {
    return undefined;
  }

  const userMessage: ChatMessage = {
    id: randomUUID(),
    role: 'user',
    content,
  };

  const messagesWithUserMessage = [...conversation.messages, userMessage];

  void logUserSentiment(messagesWithUserMessage).catch((error) => {
    console.error('Failed to analyze user sentiment', error);
  });

  const agentMessage = await createAgentChatMessage(messagesWithUserMessage);

  if (!agentMessage) {
    throw new Error('OpenAI did not return a message');
  }

  if (conversation.messages.length === 0) {
    conversation.title = createTitle(content);
  }

  conversation.messages.push(userMessage);
  conversation.messages.push(agentMessage);
  conversation.updatedAt = nowIso();

  return {
    conversation,
    message: agentMessage,
  };
}
