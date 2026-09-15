import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';

// Lightweight wrappers / skeletons around @simplewebauthn/server APIs

export async function makeRegistrationOptions({ rpName, rpID, userID, userName }: { rpName: string; rpID: string; userID: string; userName: string; }) {
  return await generateRegistrationOptions({
    rpName,
    rpID,
    userID: Buffer.from(userID, 'utf-8'),
    userName,
    attestationType: 'none',
    authenticatorSelection: { userVerification: 'preferred' },
  });
}

export async function verifyRegistration({ credential, expectedChallenge, rpID }: { credential: any; expectedChallenge: string; rpID: string; }) {
  return verifyRegistrationResponse({
    response: credential,
    expectedChallenge,
    expectedOrigin: `https://${rpID}`,
    expectedRPID: rpID,
  });
}

export async function makeAuthenticationOptions({ rpID, allowCredentials }: { rpID: string; allowCredentials?: any[] }) {
  return await generateAuthenticationOptions({
    rpID,
    allowCredentials,
    userVerification: 'preferred',
  });
}

export async function verifyAuthentication({ credential, expectedChallenge, expectedCounter, rpID, credentialPublicKey }: { credential: any; expectedChallenge: string; expectedCounter?: number; rpID: string; credentialPublicKey?: Buffer | string | Uint8Array; }) {
  // The verifyAuthenticationResponse helper expects the authenticator state; adapt as needed when wiring to DB.
  const credentialObj = credentialPublicKey
    ? {
        id: credential.id,
        publicKey: ((): Uint8Array => {
          if (credentialPublicKey instanceof Uint8Array) return credentialPublicKey;
          if (Buffer.isBuffer(credentialPublicKey)) return new Uint8Array(credentialPublicKey);
          if (typeof credentialPublicKey === 'string') return Uint8Array.from(Buffer.from(credentialPublicKey, 'base64'));
          return new Uint8Array();
        })(),
        counter: typeof expectedCounter === 'number' ? expectedCounter : 0,
        transports: [],
      }
    : undefined;

  return verifyAuthenticationResponse({
    response: credential,
    expectedChallenge,
    expectedOrigin: `https://${rpID}`,
    expectedRPID: rpID,
    credential: credentialObj as any,
  });
}
