import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { makeRegistrationOptions } from '@/lib/webauthn';

// In-memory challenge store for demo purposes. In production use a durable session store.
import { registrationChallenges } from '@/lib/challengeStore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = body?.username;
    if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 });

    // Find or create user by username
    let user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      user = await prisma.user.create({ data: { username } });
    }

    const rpName = process.env.RP_NAME ?? 'Passkey Demo';
    const rpID = process.env.RP_ID ?? process.env.NEXT_PUBLIC_VERCEL_URL ?? 'localhost';

    const options = await makeRegistrationOptions({ rpName, rpID, userID: String(user.id), userName: user.username });

    // store challenge for later verification
    registrationChallenges.set(String(user.id), options.challenge);

    return NextResponse.json(options);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
