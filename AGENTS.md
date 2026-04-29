# AGENTS.md

## Repository Expectations

- This is a Node 18+ project that uses `npm`, not yarn or pnpm.
- Backend code lives in `backend/`; frontend code lives in `frontend/`.
- Do not edit generated or installed dependency directories such as `backend/node_modules/`, `frontend/node_modules/`, `backend/dist/`, or `frontend/dist/` unless explicitly asked.
- Treat `backend/.env` and `backend/local.env` as local secret/config files. Do not print API keys or commit-style secret values into docs or examples.

## Build And Run

- Backend: `cd backend && npm install && npm start`
- Frontend: `cd frontend && npm install && npm run dev`
- Frontend production check: `cd frontend && npm run build`
- Backend TypeScript check: `cd backend && npx tsc --noEmit`

## Coding Guidance

- Preserve the existing separation between controller, manager, schema, service, and config code in the backend.
- Prefer small, readable React components and keep styling near the existing frontend CSS/styled-components patterns.
- When changing OpenAI behavior, keep server-side validation for the "different emoji signature" requirement intact.
- If you add or change setup steps, update `implementation-readme.md` so the project remains easy to run.
- When product/implementation decisions, user preferences, rejected approaches, or solution-specific reasoning should be preserved, propose an `implementation-readme.md` update and get user approval before editing that file.
