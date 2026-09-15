import { NextResponse } from 'next/server';
import type { AuthenticationResponseJSON } from '@simplewebauthn/server';
import { prisma } from '@/lib/db';
import { getRpID, verifyAuthentication } from '@/lib/webauthn';
import { consumeAuthenticationChallenge } from '@/lib/challengeStore';
import { createSessionToken } from '@/lib/session';

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
    const expectedChallenge = consumeAuthenticationChallenge(userId);
    if (!expectedChallenge) return NextResponse.json({ error: LOGIN_ERROR }, { status: 400 });

    const credentialRecord = credential as Record<string, unknown>;
    const credentialId = typeof credentialRecord.id === 'string' ? credentialRecord.id : '';
    if (!credentialId) {
      return NextResponse.json({ error: LOGIN_ERROR }, { status: 400 });
    }

    const stored = await prisma.credential.findUnique({ where: { credentialId } });
    if (!stored) return NextResponse.json({ error: LOGIN_ERROR }, { status: 400 });

    const rpID = getRpID(req);
    const expectedOrigin = process.env.RP_ORIGIN ?? new URL(req.url).origin;
    const verification = await verifyAuthentication({
      credential: credential as AuthenticationResponseJSON,
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
    const newCounter =
      verification.authenticationInfo?.newCounter ??
      stored.counter + 1;

    await prisma.credential.update({
      where: { credentialId },
      data: { counter: Number(newCounter), lastUsed: new Date() },
    });

    const response = NextResponse.json({ verified: true });
    response.cookies.set({
      name: 'passkey_session',
      value: createSessionToken(stored.internalUserId),
      httpOnly: true,
      sameSite: 'lax',
      secure: new URL(req.url).protocol === 'https:',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (err: unknown) {
    return NextResponse.json({ error: LOGIN_ERROR }, { status: 400 });
  }
}
