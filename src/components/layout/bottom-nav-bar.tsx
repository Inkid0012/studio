
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { href: "/discover", icon: Home, label: "Home" },
  { href: "/chat", icon: MessageCircle, label: "Chat" },
  { href: "/profile", icon: User, label: "Me" },
];

export function BottomNavBar({ totalUnreadCount }: { totalUnreadCount: number }) {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-12 bg-background/90 backdrop-blur-sm">
      <div className="grid h-full max-w-lg grid-cols-3 mx-auto font-medium">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex flex-col items-center justify-center px-5 group",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 mb-1"
                )}
              />
              <span className="text-xs font-body">{item.label}</span>
              {item.href === "/chat" && totalUnreadCount > 0 && (
                <Badge className="absolute top-2 right-6 px-2 py-0.5 text-xs h-5">
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                </Badge>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
