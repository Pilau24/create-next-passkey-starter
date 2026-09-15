"use client";

import Link from "next/link";
import { useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { Fingerprint, LoaderCircle, ShieldCheck } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type AuthenticationOptions = Parameters<typeof startAuthentication>[0]["optionsJSON"] & {
  userId: string;
};
const GENERIC_LOGIN_ERROR =
  "We couldn't sign you in with that passkey. Check your details and try again.";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsAuthenticating(true);

    try {
      const optionsResponse = await fetch("/api/auth/login/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const options = (await optionsResponse.json()) as
        | AuthenticationOptions
        | { error?: string };

      if (!optionsResponse.ok || !("userId" in options)) {
        throw new Error(GENERIC_LOGIN_ERROR);
      }

      const { userId, ...authenticationOptions } = options;
      const credential = await startAuthentication({
        optionsJSON: authenticationOptions,
      });
      const verificationResponse = await fetch("/api/auth/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, credential }),
      });
      const verification = (await verificationResponse.json()) as {
        verified?: boolean;
        error?: string;
      };

      if (!verificationResponse.ok || !verification.verified) {
        throw new Error(GENERIC_LOGIN_ERROR);
      }

      window.location.assign("/");
    } catch (authenticationError) {
      setError(
        authenticationError instanceof Error
          ? authenticationError.message === GENERIC_LOGIN_ERROR
            ? authenticationError.message
            : "Sign-in was cancelled or could not be completed."
          : "Sign-in was cancelled or could not be completed.",
      );
    } finally {
      setIsAuthenticating(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="gap-4 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Fingerprint aria-hidden="true" className="size-6" />
          </div>
          <div className="flex flex-col gap-2">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>
              Sign in securely with the passkey saved on your device.
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent>
            <FieldGroup>
              <Field data-invalid={Boolean(error)}>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  id="username"
                  name="username"
                  autoComplete="username webauthn"
                  placeholder="you@example.com"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  aria-invalid={Boolean(error)}
                  required
                  disabled={isAuthenticating}
                />
                {error ? (
                  <FieldError>{error}</FieldError>
                ) : (
                  <FieldDescription>
                    Use the username associated with your passkey.
                  </FieldDescription>
                )}
              </Field>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isAuthenticating}
              >
                {isAuthenticating ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="animate-spin"
                    data-icon="inline-start"
                  />
                ) : (
                  <ShieldCheck data-icon="inline-start" aria-hidden="true" />
                )}
                {isAuthenticating ? "Waiting for passkey..." : "Continue with passkey"}
              </Button>
            </FieldGroup>
          </CardContent>
        </form>

        <CardFooter className="justify-center border-t pt-6">
          <p className="text-sm text-muted-foreground">
            New here?{" "}
            <Link
              className="font-medium text-foreground underline underline-offset-4"
              href="/register"
            >
              Create a passkey
            </Link>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
