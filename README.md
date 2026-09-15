# Passkey Auth Template

A reusable Next.js starter for projects that need passwordless authentication
with WebAuthn passkeys.

## Included

- Passkey registration and sign-in flows
- SimpleWebAuthn browser and server verification
- Prisma persistence for users and credentials
- Signed, HTTP-only session cookies
- Short-lived, single-use WebAuthn challenges
- Login, registration, and authenticated home-page examples
- Base UI components and Tailwind styling

## Create a new app

Run the published starter from any directory:

```bash
pnpm create next-passkey-starter my-passkey-app
```

The command creates a new project, derives its package name from the target
directory, and leaves the template's authentication routes, Prisma schema, UI,
and migrations ready to customize.

Options:

```text
--force   Allow an existing non-empty directory to be overwritten
--help    Show command help
```

Then follow the printed setup steps:

```powershell
cd my-passkey-app
Copy-Item .env.example .env
pnpm install
pnpm prisma migrate dev
pnpm dev
```

## Develop this template locally

Install dependencies in the template repository:

```bash
pnpm install
```

### Configure environment variables

Copy `.env.example` to `.env` and update the values:

```powershell
Copy-Item .env.example .env
```

Required variables:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Prisma database connection string |
| `SESSION_SECRET` | Secret used to sign session cookies |
| `RP_NAME` | Name shown by the passkey provider |
| `RP_ID` | WebAuthn relying-party ID, usually the hostname |
| `RP_ORIGIN` | Full origin used for verification, such as `http://localhost:3000` |

`SESSION_SECRET` is required in production. The development fallback is only
intended for local work.

### Prepare the database

The starter uses SQLite by default:

```bash
pnpm prisma migrate dev
pnpm prisma generate
```

Replace the Prisma datasource and adapter in `prisma/schema.prisma` and
`lib/db.ts` when using another database provider.

### Start the app

```bash
pnpm dev
```

Open <http://localhost:3000>, then create a passkey from the registration page.

## Adapting the template

- Replace the example content in `app/page.tsx`.
- Update the application name and metadata in `app/layout.tsx`.
- Customize `app/login/page.tsx` and `app/register/page.tsx` to match your UX.
- Extend the `User` and `Credential` models for application-specific data.
- Replace the in-memory challenge store in `lib/challengeStore.ts` with a
  durable store before deploying multiple instances.
- Use a stable production `RP_ID` and `RP_ORIGIN`; passkeys are origin-bound.
- Configure HTTPS in production.

## Useful commands

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm pack:check
pnpm prisma studio
pnpm prisma migrate dev
```

## Publishing

The package is published as `create-next-passkey-starter`. Create a version
tag to trigger `.github/workflows/publish.yml`:

```bash
pnpm version patch
git push origin main --follow-tags
```

Configure npm trusted publishing for this GitHub repository and the package
before the first release. The workflow uses GitHub OIDC provenance and does
not store an npm token in the repository.

## Project structure

```text
app/api/auth/       WebAuthn registration and authentication endpoints
app/login/          Sign-in example
app/register/       Passkey registration example
lib/challengeStore  Single-use challenge storage
lib/db.ts            Prisma client and database adapter
lib/session.ts       Signed session cookie helpers
lib/webauthn.ts      SimpleWebAuthn server wrappers
prisma/              Schema and migrations
```
