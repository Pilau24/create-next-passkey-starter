import { NextResponse } from 'next/server';
import type { RegistrationResponseJSON } from '@simplewebauthn/server';
import { prisma } from '@/lib/db';
import { getRpID, verifyRegistration } from '@/lib/webauthn';
import { consumeRegistrationChallenge } from '@/lib/challengeStore';

type JsonBody = Record<string, unknown>;
const REGISTER_ERROR = 'Unable to create a passkey.';

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

  const rawUserId = body.userId;
  const sessionId = typeof rawUserId === 'string' ? rawUserId : '';
  const credential = body.credential;

  if (typeof credential !== 'object' || credential === null || Array.isArray(credential) || !sessionId.trim()) {
    return NextResponse.json({ error: REGISTER_ERROR }, { status: 400 });
  }

  try {
    const registrationSession = consumeRegistrationChallenge(sessionId);
    if (!registrationSession) return NextResponse.json({ error: REGISTER_ERROR }, { status: 400 });

    const rpID = getRpID(req);
    const expectedOrigin = process.env.RP_ORIGIN ?? new URL(req.url).origin;

    const verification = await verifyRegistration({
      credential: credential as RegistrationResponseJSON,
      expectedChallenge: registrationSession.challenge,
      rpID,
      expectedOrigin,
    });

    if (!verification.verified) {
      return NextResponse.json({ verified: false, error: REGISTER_ERROR }, { status: 400 });
    }

    const regInfo = verification.registrationInfo;
    if (!regInfo) return NextResponse.json({ error: REGISTER_ERROR }, { status: 400 });

    const storedCredentialId = verification.registrationInfo.credential.id;

    // credentialPublicKey comes as ArrayBuffer/Buffer/string depending on helper. Store as Bytes in Prisma.
    const credentialPublicKey = verification.registrationInfo.credential.publicKey;
    const publicKey = Buffer.from(credentialPublicKey);

    const counter = verification.registrationInfo.credential.counter ?? 0;

    await prisma.credential.create({
      data: {
        credentialId: storedCredentialId,
        publicKey,
        internalUserId: Number(registrationSession.userId),
        webauthnUserId: storedCredentialId,
        counter: Number(counter),
      },
    });

    return NextResponse.json({ verified: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: REGISTER_ERROR }, { status: 400 });
  }
}
