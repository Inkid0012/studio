
'use client';

import { BottomNavBar } from "@/components/layout/bottom-nav-bar";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { getCurrentUser, getConversationsForUser, onIncomingCall, updateUserLocation } from "@/lib/data";
import type { Call, User, Conversation, Location } from "@/types";
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
  const [isClient, setIsClient] = useState(false);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    const user = getCurrentUser();
    if (!user) {
        if (!window.location.pathname.startsWith('/login')) {
            router.push('/login');
        }
    } else {
        setCurrentUser(user);
    }
  }, [router]);

  useEffect(() => {
    if (!currentUser || !isClient) return;
    
    // --- Location Handling ---
    if (!currentUser.location && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation: Location = { latitude, longitude };
          await updateUserLocation(currentUser.id, newLocation);
          setCurrentUser(prevUser => prevUser ? { ...prevUser, location: newLocation } : null);
        },
        (error) => {
          console.warn(`Location error: ${error.message}`);
          if (error.code === 1) { // PERMISSION_DENIED
             toast({
              variant: 'destructive',
              title: 'Location Access Denied',
              description: 'Distance to other users cannot be calculated. Please enable location permissions.',
            });
          }
        }
      );
    }

    // Listen for new incoming calls
    // const unsubscribeCalls = onIncomingCall(currentUser.id, (call: Call) => {
    //     if (!pathname.startsWith('/call/')) {
    //         router.push(`/call/${call.id}?otherUserId=${call.from}`);
    //     }
    // });

    const unsubscribeConvos = getConversationsForUser(currentUser.id, (convos: Conversation[]) => {
      const total = convos.reduce((sum, convo) => sum + (convo.unreadCount || 0), 0);
      setTotalUnreadCount(total);
    });

    return () => {
      // unsubscribeCalls();
      unsubscribeConvos();
    };
  }, [currentUser, router, pathname, isClient, toast]);

  const showNavBar = isClient && mainNavPaths.includes(pathname);

  if (!currentUser) {
      return null; // Don't render anything until we know if user is logged in
  }

  return (
    <>
      <main className={cn(showNavBar && "pb-24")}>{children}</main>
      {showNavBar && <BottomNavBar totalUnreadCount={totalUnreadCount} />}
    </>
  );
}
