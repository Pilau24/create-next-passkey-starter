# Copilot instructions for passkey-auth-template

This workspace is governed by the repository-level rules in AGENTS.md. Keep all AI-assisted work aligned with the same process across VS Code Copilot, Claude Code, Cursor, Devin, and other agent tools.

## Project workflow

- Assume `pnpm dev` is already running and the relevant page is open in the browser. Use the existing development server to inspect and verify UI changes instead of starting another server.
- Use `pnpm` for package management and project commands. When a shadcn component or pattern is available, use the shadcn CLI (`pnpm dlx shadcn@latest`) whenever possible instead of manually recreating it.
- Test after changes.
- Do not attempt a production build.
- Do not attempt to start a development server, since one should already be running.

## Cleanup

When tasked with cleaning up the project and checking for issues, follow the basic steps below in order. You may deviate slightly and repeat steps as needed:

1. Remove modules with `pnpm clean --lockfile`.
2. Install everything fresh with `pnpm install`.
3. Regenerate Prisma with `pnpm prisma generate`.
4. Ask the user for approval before running `pnpm build`.
5. Check for formatting problems.
6. Run `pnpm lint`.

## Next.js note

This repo includes a custom Next.js compatibility note from AGENTS.md: "This is NOT the Next.js you know." Before writing code, read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) and heed deprecation notices.

## Agent compatibility

- Keep instructions consistent with the root `AGENTS.md` file.
- Treat this file as the workspace-level default for GitHub Copilot chat requests.
- Keep agent-specific instructions aligned with the shared rules when additional agent integrations are added.

## General expectations

- Make precise, surgical changes that fully address the task.
- Do not modify unrelated code.
- Validate changes with the smallest relevant test or lint step that covers the behavior.
- Keep documentation updates limited to changes directly related to the work.
