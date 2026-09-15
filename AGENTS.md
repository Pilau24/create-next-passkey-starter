<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project workflow

- Assume `pnpm dev` is already running and the relevant page is open in the browser. Use the existing development server to inspect and verify UI changes instead of starting another server.
- Use `pnpm` for package management and project commands. When a shadcn component or pattern is available, use the shadcn CLI (`pnpm dlx shadcn@latest`) whenever possible instead of manually recreating it.
- Test after changes.
- Do not attempt a production build.
- Do not attempt to start a development server, since one should already be running.

## Cleanup

When tasked with cleaning up the project and checking for issues follow the basic steps below. One step at a time. You may devieate slightly and repeat steps:

1. Remove modules with `pnpm clean --lockfile`.
2. Install everything fresh with `pnpm install`
3. Regenerate prisma `pnpm prisma generate`
4. Ask the user for approval before running `pnpm build`.
5. Check for formatting problems.
6. Run `pnpm lint`.
