import express from 'express';
import {z} from 'zod';
import {createAgentChatMessage, logUserSentiment} from '../manager/chat.manager';
import {chatRequestSchema} from '../schema/chat.schema';

const router = express.Router();

router.post('/chat', async (req, res) => {
  try {
    const {messages} = chatRequestSchema.parse(req.body);
    void logUserSentiment(messages).catch((error) => {
      console.error('Failed to analyze user sentiment', error);
    });

    const message = await createAgentChatMessage(messages);

    if (!message) {
      res.status(502).send({error: 'OpenAI did not return a message'});
      return;
    }

    res.send({message});
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).send({error: error.flatten()});
      return;
    }

    console.error('Failed to get OpenAI response', error);
    res.status(500).send({error: 'Failed to get OpenAI response'});
  }
});

export default router;
