import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { makeAuthenticationOptions } from '@/lib/webauthn';
import { authChallenges } from '@/lib/challengeStore';

type JsonBody = Record<string, unknown>;
const LOGIN_ERROR = 'Unable to start sign-in.';

export async function POST(req: Request) {
  let body: JsonBody | null = null;

  try {
    const parsed = await req.json();
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return NextResponse.json({ error: LOGIN_ERROR }, { status: 400 });
    }
    body = parsed as JsonBody;
  } catch {
    return NextResponse.json({ error: LOGIN_ERROR }, { status: 400 });
  }

  const username = typeof body.username === 'string' ? body.username.trim() : '';
  if (!username) {
    return NextResponse.json({ error: LOGIN_ERROR }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { username } });

    const credentials = user
      ? await prisma.credential.findMany({ where: { internalUserId: user.id } })
      : [];

    const allowCredentials = credentials.map((credential: { credentialId: string }) => ({
      id: credential.credentialId,
      type: 'public-key',
    }));

    const rpID = process.env.RP_ID ?? process.env.NEXT_PUBLIC_VERCEL_URL ?? 'localhost';
    const options = await makeAuthenticationOptions({ rpID, allowCredentials });
    const challengeKey = crypto.randomUUID();

    // Use a random challenge key so the response never exposes whether a user exists.
    authChallenges.set(challengeKey, options.challenge);

    return NextResponse.json({ ...options, userId: challengeKey });
  } catch (err: unknown) {
    return NextResponse.json({ error: LOGIN_ERROR }, { status: 400 });
  }
}
