import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyRegistration } from '@/lib/webauthn';
import { registrationChallenges } from '@/lib/challengeStore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { credential, userId } = body ?? {};
    if (!credential || !userId) return NextResponse.json({ error: 'credential and userId required' }, { status: 400 });

    const expectedChallenge = registrationChallenges.get(String(userId));
    if (!expectedChallenge) return NextResponse.json({ error: 'no registration challenge found' }, { status: 400 });

    const rpID = process.env.RP_ID ?? process.env.NEXT_PUBLIC_VERCEL_URL ?? 'localhost';

    const verification = await verifyRegistration({ credential, expectedChallenge, rpID });

    if (!verification.verified) return NextResponse.json({ verified: false }, { status: 400 });

    const regInfo = verification.registrationInfo;
    if (!regInfo) return NextResponse.json({ error: 'missing registration info' }, { status: 500 });

    const credentialId = Buffer.from(verification.registrationInfo!.credential.id as string, 'base64url').toString('base64');
    // store credentialId as base64url string in DB — keep the original format
    const storedCredentialId = verification.registrationInfo!.credential.id as string;

    // credentialPublicKey comes as ArrayBuffer/Buffer/string depending on helper. Store as Bytes in Prisma.
    const credentialPublicKey = verification.registrationInfo!.credential.publicKey;
    const publicKey = typeof credentialPublicKey === 'string'
     ? Buffer.from(credentialPublicKey, 'base64')
     : Buffer.from(credentialPublicKey as any);

    const counter = verification.registrationInfo!.credential.counter ?? 0;

    await prisma.credential.create({
      data: {
        credentialId: storedCredentialId,
        publicKey,
        internalUserId: Number(userId),
        webauthnUserId: storedCredentialId, // if your app has a separate userHandle use that; else store credentialId
        counter: Number(counter),
      },
    });

    // registration challenge consumed
    registrationChallenges.delete(String(userId));

    return NextResponse.json({ verified: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
