import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuthentication } from '@/lib/webauthn';
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

  const rawUserId = body.userId;
  const userId = typeof rawUserId === 'string' || typeof rawUserId === 'number' ? String(rawUserId) : '';
  const credential = body.credential;

  if (typeof credential !== 'object' || credential === null || Array.isArray(credential) || !userId.trim()) {
    return NextResponse.json({ error: 'credential and userId are required' }, { status: 400 });
  }

  try {
    const expectedChallenge = authChallenges.get(userId);
    if (!expectedChallenge) return NextResponse.json({ error: 'no auth challenge found' }, { status: 400 });

    const credentialRecord = credential as Record<string, unknown>;
    const credentialId = typeof credentialRecord.id === 'string' ? credentialRecord.id : '';
    if (!credentialId) {
      return NextResponse.json({ error: 'credential.id is required' }, { status: 400 });
    }

    const stored = await prisma.credential.findUnique({ where: { credentialId } });
    if (!stored) return NextResponse.json({ error: 'credential not found' }, { status: 404 });

    const rpID = process.env.RP_ID ?? process.env.NEXT_PUBLIC_VERCEL_URL ?? 'localhost';
    const responseRecord = credentialRecord.response as Record<string, unknown> | undefined;
    const authenticatorData =
      responseRecord && typeof responseRecord === 'object'
        ? (responseRecord as { authenticatorData?: { counter?: number } }).authenticatorData
        : undefined;

    const verification = await verifyAuthentication({
      credential: credential as Parameters<typeof verifyAuthentication>[0]['credential'],
      expectedChallenge,
      expectedCounter: Number(stored.counter),
      rpID,
      credentialPublicKey: stored.publicKey as Buffer,
    });

    if (!verification.verified) return NextResponse.json({ verified: false }, { status: 400 });

    // update counter and lastUsed
    const newCounter = verification.authenticationInfo?.newCounter ?? authenticatorData?.counter ?? stored.counter + 1;

    await prisma.credential.update({
      where: { credentialId },
      data: { counter: Number(newCounter), lastUsed: new Date() },
    });

    authChallenges.delete(String(userId));

    return NextResponse.json({ verified: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
