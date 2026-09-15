import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { makeRegistrationOptions } from '@/lib/webauthn';

// In-memory challenge store for demo purposes. In production use a durable session store.
import { registrationChallenges } from '@/lib/challengeStore';

type JsonBody = Record<string, unknown>;

export async function POST(req: Request) {
  let body: JsonBody | null = null;

  try {
    const parsed = await req.json();
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return NextResponse.json({ error: 'request body must be a JSON object' }, { status: 400 });
    }
    body = parsed as JsonBody;
  } catch {
    return NextResponse.json({ error: 'invalid or missing JSON body' }, { status: 400 });
  }

  const username = typeof body.username === 'string' ? body.username.trim() : '';
  if (!username) {
    return NextResponse.json({ error: 'username is required' }, { status: 400 });
  }

  try {
    // Find or create user by username
    let user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      user = await prisma.user.create({ data: { username } });
    }

    const rpName = process.env.RP_NAME ?? 'Passkey Demo';
    const rpID = process.env.RP_ID ?? process.env.NEXT_PUBLIC_VERCEL_URL ?? 'localhost';

    const options = await makeRegistrationOptions({ rpName, rpID, userID: String(user.id), userName: user.username });

    // store challenge for later verification
    registrationChallenges.set(String(user.id), options.challenge);

    return NextResponse.json(options);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
