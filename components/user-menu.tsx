"use client";

import { useState } from "react";
import { LogOut, Settings } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

type UserMenuProps = {
  username: string;
};

export function UserMenu({ username }: UserMenuProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const initials = username.slice(0, 2).toUpperCase();

  async function handleLogout() {
    setIsLoggingOut(true);
    const response = await fetch("/api/auth/logout", { method: "POST" });

    if (response.ok) {
      window.location.assign("/");
      return;
    }

    setIsLoggingOut(false);
  }

  return (
    <HoverCard>
      <HoverCardTrigger
        render={
          <button
            type="button"
            aria-label={`Open account menu for ${username}`}
            className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        }
      >
        <Avatar size="sm">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </HoverCardTrigger>
      <HoverCardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <p className="truncate font-medium">{username}</p>
            <p className="text-muted-foreground">Passkey account</p>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <Button variant="ghost" className="justify-start" disabled>
            <Settings data-icon="inline-start" />
            Account settings
            <span className="ml-auto text-xs text-muted-foreground">
              Soon
            </span>
          </Button>
          <Button
            variant="ghost"
            className="justify-start"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut data-icon="inline-start" />
            {isLoggingOut ? "Signing out..." : "Log out"}
          </Button>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
