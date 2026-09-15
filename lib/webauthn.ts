import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
  WebAuthnCredential,
} from '@simplewebauthn/server';

export function getRpID(request: Request) {
  return process.env.RP_ID ?? new URL(request.url).hostname;
}

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

export async function verifyRegistration({
  credential,
  expectedChallenge,
  rpID,
  expectedOrigin,
}: {
  credential: RegistrationResponseJSON;
  expectedChallenge: string;
  rpID: string;
  expectedOrigin: string;
}) {
  return verifyRegistrationResponse({
    response: credential,
    expectedChallenge,
    expectedOrigin,
    expectedRPID: rpID,
  });
}

export async function makeAuthenticationOptions({
  rpID,
  allowCredentials,
}: {
  rpID: string;
  allowCredentials?: { id: string; type: 'public-key' }[];
}) {
  return await generateAuthenticationOptions({
    rpID,
    allowCredentials,
    userVerification: 'preferred',
  });
}

export async function verifyAuthentication({
  credential,
  expectedChallenge,
  expectedCounter,
  rpID,
  expectedOrigin,
  credentialPublicKey,
}: {
  credential: AuthenticationResponseJSON;
  expectedChallenge: string;
  expectedCounter: number;
  rpID: string;
  expectedOrigin: string;
  credentialPublicKey: Buffer | Uint8Array;
}) {
  const credentialObj: WebAuthnCredential = {
    id: credential.id,
    publicKey:
      credentialPublicKey instanceof Uint8Array
        ? credentialPublicKey
        : new Uint8Array(credentialPublicKey),
    counter: expectedCounter,
  };

  return verifyAuthenticationResponse({
    response: credential,
    expectedChallenge,
    expectedOrigin,
    expectedRPID: rpID,
    credential: credentialObj,
  });
}
