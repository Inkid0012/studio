
'use client';

import { BottomNavBar } from "@/components/layout/bottom-nav-bar";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { getCurrentUser, onIncomingCall } from "@/lib/data";
import type { Conversation, User } from "@/types";
import { useToast } from "@/hooks/use-toast";

const mainNavPaths = ['/discover', '/chat', '/profile'];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, [pathname]);

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onIncomingCall(currentUser.id, (convo) => {
      const caller = convo.participants.find(p => p.id === convo.activeCall?.callerId);
      if (caller) {
          // Navigate to the call screen
          router.push(`/call/${convo.id}?otherUserId=${caller.id}&callType=incoming`);
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser, router]);

  const showNavBar = mainNavPaths.includes(pathname);

  return (
    <div className="min-h-screen bg-background">
      <main className={cn(showNavBar && "pb-24")}>{children}</main>
      {showNavBar && <BottomNavBar />}
    </div>
  );
}
