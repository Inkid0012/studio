
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/discover", icon: Home, label: "Home" },
  { href: "/chat", icon: MessageCircle, label: "Chat" },
  { href: "/profile", icon: User, label: "Me" },
];

export function BottomNavBar() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-20 bg-background/90 backdrop-blur-sm border-t border-border rounded-t-2xl">
      <div className="grid h-full max-w-lg grid-cols-3 mx-auto font-medium">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex flex-col items-center justify-center px-5 hover:bg-primary/5 group",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("w-7 h-7 mb-1", isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary")} />
              <span className="text-sm font-body">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

    