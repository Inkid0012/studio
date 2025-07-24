
'use client';

import { BottomNavBar } from "@/components/layout/bottom-nav-bar";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const mainNavPaths = ['/discover', '/chat', '/profile'];

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // The nav bar should appear on /discover, /chat, and /profile, but not on sub-pages like /chat/some-id or /profile/edit
  const showNavBar = mainNavPaths.includes(pathname);

  return (
    <div className="min-h-screen bg-background">
      <main className={cn(showNavBar && "pb-24")}>{children}</main>
      {showNavBar && <BottomNavBar />}
    </div>
  );
}
