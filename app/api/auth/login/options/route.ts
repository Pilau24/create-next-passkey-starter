import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { makeAuthenticationOptions } from '@/lib/webauthn';
import { authChallenges } from '@/lib/challengeStore';

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
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return NextResponse.json({ error: 'user not found' }, { status: 404 });

    const credentials = await prisma.credential.findMany({ where: { internalUserId: user.id } });

    const allowCredentials = credentials.map((credential: { credentialId: string }) => ({
      id: credential.credentialId,
      type: 'public-key',
    }));

    const rpID = process.env.RP_ID ?? process.env.NEXT_PUBLIC_VERCEL_URL ?? 'localhost';
    const options = await makeAuthenticationOptions({ rpID, allowCredentials });

    // store this challenge keyed to user id
    authChallenges.set(String(user.id), options.challenge);

    return NextResponse.json(options);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
