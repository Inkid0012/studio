"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/discover", icon: Flame, label: "Discover" },
  { href: "/chat", icon: MessageCircle, label: "Chat" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function BottomNavBar() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t border-border">
      <div className="grid h-full max-w-lg grid-cols-3 mx-auto font-medium">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex flex-col items-center justify-center px-5 hover:bg-primary/5 group",
                isActive ? "text-accent" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("w-6 h-6 mb-1", isActive ? "text-accent" : "text-muted-foreground group-hover:text-primary")} />
              <span className="text-xs font-body">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
