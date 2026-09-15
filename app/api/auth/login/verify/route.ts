import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuthentication } from '@/lib/webauthn';
import { authChallenges } from '@/lib/challengeStore';

type JsonBody = Record<string, unknown>;
const LOGIN_ERROR = 'Unable to sign in with that passkey.';

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

  const rawUserId = body.userId;
  const userId = typeof rawUserId === 'string' || typeof rawUserId === 'number' ? String(rawUserId) : '';
  const credential = body.credential;

  if (typeof credential !== 'object' || credential === null || Array.isArray(credential) || !userId.trim()) {
    return NextResponse.json({ error: LOGIN_ERROR }, { status: 400 });
  }

  try {
    const expectedChallenge = authChallenges.get(userId);
    if (!expectedChallenge) return NextResponse.json({ error: LOGIN_ERROR }, { status: 400 });
    authChallenges.delete(userId);

    const credentialRecord = credential as Record<string, unknown>;
    const credentialId = typeof credentialRecord.id === 'string' ? credentialRecord.id : '';
    if (!credentialId) {
      return NextResponse.json({ error: LOGIN_ERROR }, { status: 400 });
    }

    const stored = await prisma.credential.findUnique({ where: { credentialId } });
    if (!stored) return NextResponse.json({ error: LOGIN_ERROR }, { status: 400 });

    const rpID = process.env.RP_ID ?? process.env.NEXT_PUBLIC_VERCEL_URL ?? 'localhost';
    const expectedOrigin = process.env.RP_ORIGIN ?? new URL(req.url).origin;
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
      expectedOrigin,
      credentialPublicKey: stored.publicKey as Buffer,
    });

    if (!verification.verified) {
      return NextResponse.json({ verified: false, error: LOGIN_ERROR }, { status: 400 });
    }

    // update counter and lastUsed
    const newCounter = verification.authenticationInfo?.newCounter ?? authenticatorData?.counter ?? stored.counter + 1;

    await prisma.credential.update({
      where: { credentialId },
      data: { counter: Number(newCounter), lastUsed: new Date() },
    });

    return NextResponse.json({ verified: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: LOGIN_ERROR }, { status: 400 });
  }
}
