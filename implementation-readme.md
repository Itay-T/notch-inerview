# Implementation notes

## Running locally

Backend:

```bash
cd backend
npm install
npm start
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

The backend runs on `http://localhost:3000`, and the frontend usually runs on `http://localhost:5173`. Before testing real bot replies, replace the fake `OPENAI_API_KEY` in `backend/.env` with a real key.

## Emoji signature validation

The bot is asked in the system prompt to end every answer with a new emoji that was not used before. We discussed whether to give it a closed list of emojis to choose from, but that felt too limiting because the requirement only says the emoji should be different.

The chosen approach is to let OpenAI choose any emoji, then validate the response on the server. If the answer ends with a new emoji, we keep it. If the emoji was already used, or if the answer has no emoji, the server replaces/appends an unused emoji before sending the message back to the frontend.

## Sentiment extraction latency

Part B needs a second OpenAI request that uses function calling to extract the user's current sentiment. A first pass could use `Promise.all` and wait for both the chat answer and the sentiment result before returning to the frontend.

We decided not to do that because sentiment logging is a side effect, while the chat answer is the user-facing response. The backend starts sentiment extraction in parallel, but returns the chat answer as soon as it is ready. The sentiment request finishes in the background and logs its result to the console. If sentiment extraction fails, the error is logged, but the chat response still succeeds.

## Conversations

Part C adds conversation ownership to the backend. The frontend no longer sends the full message list on every chat request. Instead, it creates or selects a conversation, then sends only the new user message to `POST /conversations/:id/messages`.

The backend stores conversations in one in-memory JSON-like object. This keeps browser refreshes from losing data because the frontend can re-fetch `GET /conversations` and `GET /conversations/:id`, while still matching the exercise constraint that server refresh may lose data.

When a user sends a message, the backend first builds the next message list in memory and asks OpenAI for the agent reply. It only commits the user message and agent message to the stored conversation after the agent reply succeeds. This avoids leaving a partial user-only turn in the conversation if OpenAI fails.

One remaining concurrency concern to tackle if time allows: messages sent to the same conversation from multiple tabs or direct API calls can still overlap while OpenAI requests are in flight. A production-ready version should add a per-conversation queue or lock so each user/agent turn is processed and stored in order.

The conversation APIs are:

```text
GET /conversations
POST /conversations
GET /conversations/:id
POST /conversations/:id/messages
```
