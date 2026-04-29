import {z} from 'zod';
import {ChatMessage} from './chat.schema';

export const createConversationMessageSchema = z.object({
  content: z.string().trim().min(1),
});

export type Conversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
};

export type ConversationSummary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessagePreview: string;
};

export type ConversationsJson = {
  conversations: Record<string, Conversation>;
};

export type AddMessageResult = {
  conversation: Conversation;
  message: ChatMessage;
};
