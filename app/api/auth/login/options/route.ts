import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { makeAuthenticationOptions } from '@/lib/webauthn';
import { authChallenges } from '@/lib/challengeStore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = body?.username;
    if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return NextResponse.json({ error: 'user not found' }, { status: 404 });

    const credentials = await prisma.credential.findMany({ where: { internalUserId: user.id } });

    const allowCredentials = credentials.map((c: any) => ({ id: c.credentialId, type: 'public-key' }));

    const rpID = process.env.RP_ID ?? process.env.NEXT_PUBLIC_VERCEL_URL ?? 'localhost';
    const options = await makeAuthenticationOptions({ rpID, allowCredentials });

    // store this challenge keyed to user id
    authChallenges.set(String(user.id), options.challenge);

    return NextResponse.json(options);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
