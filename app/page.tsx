import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getUserIdFromSession } from "@/lib/session";

import { UserMenu } from "@/components/user-menu";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

export default async function Home() {
  const sessionToken = (await cookies()).get("passkey_session")?.value;
  const userId = getUserIdFromSession(sessionToken);
  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true },
      })
    : null;

  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Your App
          </Link>

          {user ? (
            <UserMenu username={user.username} />
          ) : (
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    render={<Link href="/login" />}
                    className={navigationMenuTriggerStyle()}
                  >
                    Log in
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    render={<Link href="/register" />}
                    className={navigationMenuTriggerStyle()}
                  >
                    Register
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          )}
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Simple, secure sign-in with passkeys.
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Replace this page with your application experience. Authentication is
          already wired up with passkeys.
        </p>
      </section>
    </main>
  );
}
