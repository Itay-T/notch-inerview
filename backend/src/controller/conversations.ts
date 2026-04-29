import express from 'express';
import {z} from 'zod';
import {
  addMessageToConversation,
  createConversation,
  getConversation,
  listConversations,
} from '../manager/conversation.manager';
import {createConversationMessageSchema} from '../schema/conversation.schema';

const router = express.Router();

router.get('/conversations', (_req, res) => {
  res.send({conversations: listConversations()});
});

router.post('/conversations', (_req, res) => {
  res.status(201).send({conversation: createConversation()});
});

router.get('/conversations/:id', (req, res) => {
  const conversation = getConversation(req.params.id);

  if (!conversation) {
    res.status(404).send({error: 'Conversation not found'});
    return;
  }

  res.send({conversation});
});

router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const {content} = createConversationMessageSchema.parse(req.body);
    const result = await addMessageToConversation(req.params.id, content);

    if (!result) {
      res.status(404).send({error: 'Conversation not found'});
      return;
    }

    res.send(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).send({error: error.flatten()});
      return;
    }

    console.error('Failed to add conversation message', error);
    res.status(500).send({error: 'Failed to add conversation message'});
  }
});

export default router;
