import request from 'supertest';
import {describe, expect, it} from 'vitest';
import {createApp} from '../src/app';

const app = createApp();
const emojiSignatureRegex = /(?:\p{Emoji_Presentation}|\p{Extended_Pictographic}|\p{Regional_Indicator})\uFE0F?$/u;

function expectAgentMessage(message: Record<string, unknown>) {
  expect(message).toMatchObject({
    role: 'agent',
  });
  expect(typeof message.id).toBe('string');
  expect(typeof message.content).toBe('string');
  expect(message.content).toMatch(emojiSignatureRegex);
}

describe('api', () => {
  it('returns the health check response', async () => {
    const response = await request(app)
      .get('/healthCheck')
      .expect(200);

    expect(response.text).toBe('Hello world!');
  });

  it('rejects malformed chat requests', async () => {
    const response = await request(app)
      .post('/chat')
      .send({messages: []})
      .expect(400);

    expect(response.body.error).toBeDefined();
  });

  it('returns an OpenAI-backed answer from the chat endpoint', async () => {
    const response = await request(app)
      .post('/chat')
      .send({
        messages: [
          {
            id: 'user-message-1',
            role: 'user',
            content: 'Reply with one short sentence about API tests.',
          },
        ],
      })
      .expect(200);

    expectAgentMessage(response.body.message);
  });

  it('creates, lists, and fetches conversations', async () => {
    const createResponse = await request(app)
      .post('/conversations')
      .expect(201);

    const conversation = createResponse.body.conversation;
    expect(conversation).toMatchObject({
      title: 'New conversation',
      messages: [],
    });
    expect(typeof conversation.id).toBe('string');
    expect(typeof conversation.createdAt).toBe('string');
    expect(typeof conversation.updatedAt).toBe('string');

    const listResponse = await request(app)
      .get('/conversations')
      .expect(200);

    expect(listResponse.body.conversations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: conversation.id,
          title: 'New conversation',
          messageCount: 0,
          lastMessagePreview: '',
        }),
      ])
    );

    const getResponse = await request(app)
      .get(`/conversations/${conversation.id}`)
      .expect(200);

    expect(getResponse.body.conversation).toMatchObject({
      id: conversation.id,
      title: 'New conversation',
      messages: [],
    });
  });

  it('returns 404 for missing conversations', async () => {
    const response = await request(app)
      .get('/conversations/missing-conversation')
      .expect(404);

    expect(response.body).toEqual({error: 'Conversation not found'});
  });

  it('adds a user message and OpenAI-backed answer to a conversation', async () => {
    const createResponse = await request(app)
      .post('/conversations')
      .expect(201);
    const conversationId = createResponse.body.conversation.id;

    const messageResponse = await request(app)
      .post(`/conversations/${conversationId}/messages`)
      .send({content: 'Give me one quick testing tip.'})
      .expect(200);

    expectAgentMessage(messageResponse.body.message);
    expect(messageResponse.body.conversation).toMatchObject({
      id: conversationId,
      title: 'Give me one quick testing tip.',
    });
    expect(messageResponse.body.conversation.messages).toHaveLength(2);
    expect(messageResponse.body.conversation.messages[0]).toMatchObject({
      role: 'user',
      content: 'Give me one quick testing tip.',
    });
    expect(messageResponse.body.conversation.messages[1]).toMatchObject(
      messageResponse.body.message
    );
  });

  it('rejects empty conversation messages', async () => {
    const createResponse = await request(app)
      .post('/conversations')
      .expect(201);
    const conversationId = createResponse.body.conversation.id;

    const response = await request(app)
      .post(`/conversations/${conversationId}/messages`)
      .send({content: '   '})
      .expect(400);

    expect(response.body.error).toBeDefined();
  });
});
