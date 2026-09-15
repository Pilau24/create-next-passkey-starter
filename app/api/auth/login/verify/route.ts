import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAuthentication } from '@/lib/webauthn';
import { authChallenges } from '@/lib/challengeStore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { credential, userId } = body ?? {};
    if (!credential || !userId) return NextResponse.json({ error: 'credential and userId required' }, { status: 400 });

    const expectedChallenge = authChallenges.get(String(userId));
    if (!expectedChallenge) return NextResponse.json({ error: 'no auth challenge found' }, { status: 400 });

    const credentialId = credential.id as string;

    const stored = await prisma.credential.findUnique({ where: { credentialId } });
    if (!stored) return NextResponse.json({ error: 'credential not found' }, { status: 404 });

    const rpID = process.env.RP_ID ?? process.env.NEXT_PUBLIC_VERCEL_URL ?? 'localhost';

    const verification = await verifyAuthentication({
      credential,
      expectedChallenge,
      expectedCounter: Number(stored.counter),
      rpID,
      credentialPublicKey: stored.publicKey as Buffer,
    });

    if (!verification.verified) return NextResponse.json({ verified: false }, { status: 400 });

    // update counter and lastUsed
    const newCounter = verification.authenticationInfo?.newCounter ?? credential.response?.authenticatorData?.counter ?? stored.counter + 1;

    await prisma.credential.update({
      where: { credentialId },
      data: { counter: Number(newCounter), lastUsed: new Date() },
    });

    authChallenges.delete(String(userId));

    return NextResponse.json({ verified: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
