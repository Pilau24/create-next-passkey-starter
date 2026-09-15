<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project workflow

- Assume `pnpm dev` is already running and the relevant page is open in the browser. Use the existing development server to inspect and verify UI changes rather than starting another server.
- Use `pnpm` for package management and project commands. When a shadcn component or pattern is available, use the shadcn CLI (`pnpm dlx shadcn@latest`) whenever possible instead of manually recreating it.
- Test after changes.
- Do not attempt a production build.
- Do not attempt to start a development server as one should already be running.
