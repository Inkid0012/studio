
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
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This effect runs once on mount to confirm we are on the client.
    setIsClient(true);
    // We also get the user synchronously on the first check.
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    // This separate effect handles redirection once we know we are on the client.
    if (isClient && !currentUser) {
       if (!window.location.pathname.startsWith('/login')) {
         router.push('/login');
       }
    }
  }, [currentUser, isClient, router, pathname]);

  useEffect(() => {
    if (!currentUser || !isClient) return;

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
  }, [currentUser, router, pathname, isClient]);

  // The nav bar should only appear on the exact main navigation paths.
  const showNavBar = isClient && mainNavPaths.includes(pathname);

  // Avoid rendering children until we have confirmed auth status on the client.
  // This prevents rendering content meant for logged-in users to logged-out users.
  if (!currentUser && isClient) {
      return null; // or a loading spinner
  }

  return (
    <div className="min-h-screen bg-background">
      <main className={cn(showNavBar && "pb-24")}>{children}</main>
      {showNavBar && <BottomNavBar />}
    </div>
  );
}
