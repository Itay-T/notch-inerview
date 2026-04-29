import {z} from 'zod';

export const chatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'agent']),
  content: z.string().min(1),
});

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
