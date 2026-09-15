const CHALLENGE_TTL_MS = 5 * 60 * 1000;

type StoredChallenge<T> = {
  value: T;
  expiresAt: number;
};

const registrationChallenges = new Map<
  string,
  StoredChallenge<{ challenge: string; userId: string }>
>();
const authChallenges = new Map<string, StoredChallenge<string>>();

export function storeRegistrationChallenge(
  key: string,
  value: { challenge: string; userId: string },
) {
  registrationChallenges.set(key, {
    value,
    expiresAt: Date.now() + CHALLENGE_TTL_MS,
  });
}

export function consumeRegistrationChallenge(key: string) {
  return consumeChallenge(registrationChallenges, key);
}

export function storeAuthenticationChallenge(key: string, challenge: string) {
  authChallenges.set(key, {
    value: challenge,
    expiresAt: Date.now() + CHALLENGE_TTL_MS,
  });
}

export function consumeAuthenticationChallenge(key: string) {
  return consumeChallenge(authChallenges, key);
}

function consumeChallenge<T>(
  store: Map<string, StoredChallenge<T>>,
  key: string,
) {
  const stored = store.get(key);
  store.delete(key);

  if (!stored || stored.expiresAt < Date.now()) {
    return undefined;
  }

  return stored.value;
}
