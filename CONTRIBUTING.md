# Contributing

## Prerequisites

- Node.js 18+
- npm

## Setup

1. Install deps: `npm install`
2. Create env file: copy `/.env.example` to `/.env` and fill values
3. Run dev: `npm run dev`

## Code style

- Keep changes focused and consistent with existing patterns.
- Prefer TypeScript types over `any` where reasonable.
- Do not commit secrets (`.env`) or build outputs (`.next/`, `dist/`).

## Testing / checks

- Lint: `npm run lint`
- Build: `npm run build`

## Database changes

- Put schema/RLS changes in `migrations/` (new numbered file).
- Keep migrations idempotent when possible and document any manual steps.

