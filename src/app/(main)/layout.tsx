
'use client';

import { BottomNavBar } from "@/components/layout/bottom-nav-bar";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { getCurrentUser, onIncomingCall } from "@/lib/data";
import type { Call, User } from "@/types";

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
    if (user) {
        setCurrentUser(user);
    } else {
        router.push('/login');
    }
  }, [pathname, router]);

  useEffect(() => {
    if (!currentUser) return;

    // Listen for new incoming calls
    const unsubscribe = onIncomingCall(currentUser.id, (call: Call) => {
        if (!pathname.startsWith('/call/')) {
            router.push(`/call/${call.id}?otherUserId=${call.from}`);
        }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser, router, pathname]);

  const showNavBar = mainNavPaths.some(path => pathname === path || (path !== '/profile' && pathname.startsWith(path)));

  return (
    <div className="min-h-screen bg-background">
      <main className={cn(showNavBar && "pb-24")}>{children}</main>
      {showNavBar && <BottomNavBar />}
    </div>
  );
}
