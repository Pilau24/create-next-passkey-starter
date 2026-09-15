import { createHmac, timingSafeEqual } from "node:crypto";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be configured in production.");
  }

  return secret ?? "passkey-demo-development-secret";
}

export function createSessionToken(userId: number) {
  const payload = `${userId}.${Math.floor(Date.now() / 1000)}`;
  const encodedPayload = Buffer.from(payload).toString("base64url");
  const signature = createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
}

export function getUserIdFromSession(token: string | undefined) {
  if (!token) return undefined;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return undefined;

  const expectedSignature = createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest("base64url");
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (
    provided.length !== expected.length ||
    !timingSafeEqual(provided, expected)
  ) {
    return undefined;
  }

  const payload = Buffer.from(encodedPayload, "base64url").toString("utf8");
  const [rawUserId, rawIssuedAt] = payload.split(".");
  const userId = Number(rawUserId);
  const issuedAt = Number(rawIssuedAt);
  const now = Math.floor(Date.now() / 1000);

  if (
    !Number.isInteger(userId) ||
    userId <= 0 ||
    !Number.isInteger(issuedAt) ||
    now - issuedAt < 0 ||
    now - issuedAt > SESSION_TTL_SECONDS
  ) {
    return undefined;
  }

  return userId;
}
