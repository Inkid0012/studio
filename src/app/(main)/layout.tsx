
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

    const handleCallEvent = (convo: Conversation) => {
        if (convo.activeCall && convo.activeCall.callerId !== currentUser.id) {
            // Incoming call
            if(!pathname.startsWith('/call/')) {
                 router.push(`/call/${convo.id}?otherUserId=${convo.activeCall.callerId}&callType=incoming`);
            }
        } else if (!convo.activeCall) {
            // Call ended
             if(pathname.startsWith('/call/')) {
                // Dispatch a custom event to notify the call page
                window.dispatchEvent(new CustomEvent('call-ended'));
            }
        }
    };

    const unsubscribe = onIncomingCall(currentUser.id, handleCallEvent);

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser, router, pathname]);

  const showNavBar = mainNavPaths.includes(pathname) || pathname.startsWith('/profile');

  return (
    <div className="min-h-screen bg-background">
      <main className={cn(showNavBar && "pb-24")}>{children}</main>
      {showNavBar && <BottomNavBar />}
    </div>
  );
}

    