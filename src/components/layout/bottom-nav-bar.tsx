
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { FizuLogo } from "../icons/fizu-logo";

const navItems = [
  { href: "/discover", icon: FizuLogo, label: "Home" },
  { href: "/chat", icon: MessageCircle, label: "Chat" },
  { href: "/profile", icon: User, label: "Me" },
];

export function BottomNavBar({ totalUnreadCount }: { totalUnreadCount: number }) {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-20 bg-background/90 backdrop-blur-sm border-t border-border rounded-t-2xl">
      <div className="grid h-full max-w-lg grid-cols-3 mx-auto font-medium">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const isHomeIcon = item.label === "Home";

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex flex-col items-center justify-center px-5 hover:bg-primary/5 group",
                isActive ? "text-primary" : "text-accent"
              )}
            >
              <item.icon
                className={cn(
                  "w-7 h-7 mb-1",
                   isHomeIcon && "text-2xl" // Special sizing for the logo
                )}
              />
              <span className="text-sm font-body">{item.label}</span>
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
