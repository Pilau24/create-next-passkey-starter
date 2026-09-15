import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getRpID, makeRegistrationOptions } from '@/lib/webauthn';

// In-memory challenge store for demo purposes. In production use a durable session store.
import { registrationChallenges } from '@/lib/challengeStore';

type JsonBody = Record<string, unknown>;
const REGISTER_ERROR = 'Unable to start registration.';

export async function POST(req: Request) {
  let body: JsonBody | null = null;

  try {
    const parsed = await req.json();
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return NextResponse.json({ error: REGISTER_ERROR }, { status: 400 });
    }
    body = parsed as JsonBody;
  } catch {
    return NextResponse.json({ error: REGISTER_ERROR }, { status: 400 });
  }

  const username = typeof body.username === 'string' ? body.username.trim() : '';
  if (!username) {
    return NextResponse.json({ error: REGISTER_ERROR }, { status: 400 });
  }

  try {
    // Find or create user by username
    let user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      user = await prisma.user.create({ data: { username } });
    }

    const rpName = process.env.RP_NAME ?? 'Passkey Demo';
    const rpID = getRpID(req);

    const options = await makeRegistrationOptions({ rpName, rpID, userID: String(user.id), userName: user.username });

    const sessionId = crypto.randomUUID();
    registrationChallenges.set(sessionId, {
      challenge: options.challenge,
      userId: String(user.id),
    });

    return NextResponse.json({ ...options, userId: sessionId });
  } catch (err: unknown) {
    return NextResponse.json({ error: REGISTER_ERROR }, { status: 400 });
  }
}
