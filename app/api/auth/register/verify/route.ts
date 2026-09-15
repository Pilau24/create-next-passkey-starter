import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyRegistration } from '@/lib/webauthn';
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

  const rawUserId = body.userId;
  const userId = typeof rawUserId === 'string' || typeof rawUserId === 'number' ? String(rawUserId) : '';
  const credential = body.credential;

  if (typeof credential !== 'object' || credential === null || Array.isArray(credential) || !userId.trim()) {
    return NextResponse.json({ error: 'credential and userId are required' }, { status: 400 });
  }

  try {
    const expectedChallenge = registrationChallenges.get(userId);
    if (!expectedChallenge) return NextResponse.json({ error: 'no registration challenge found' }, { status: 400 });

    const rpID = process.env.RP_ID ?? process.env.NEXT_PUBLIC_VERCEL_URL ?? 'localhost';

    const verification = await verifyRegistration({ credential, expectedChallenge, rpID });

    if (!verification.verified) return NextResponse.json({ verified: false }, { status: 400 });

    const regInfo = verification.registrationInfo;
    if (!regInfo) return NextResponse.json({ error: 'missing registration info' }, { status: 500 });

    const storedCredentialId = verification.registrationInfo.credential.id as string;

    // credentialPublicKey comes as ArrayBuffer/Buffer/string depending on helper. Store as Bytes in Prisma.
    const credentialPublicKey = verification.registrationInfo.credential.publicKey;
    const publicKey = typeof credentialPublicKey === 'string'
      ? Buffer.from(credentialPublicKey, 'base64')
      : Buffer.from(credentialPublicKey as any);

    const counter = verification.registrationInfo.credential.counter ?? 0;

    await prisma.credential.create({
      data: {
        credentialId: storedCredentialId,
        publicKey,
        internalUserId: Number(userId),
        webauthnUserId: storedCredentialId,
        counter: Number(counter),
      },
    });

    // registration challenge consumed
    registrationChallenges.delete(userId);

    return NextResponse.json({ verified: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
