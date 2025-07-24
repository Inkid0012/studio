"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MainHeaderProps {
  title: string;
  showBackButton?: boolean;
  children?: React.ReactNode;
}

export function MainHeader({ title, showBackButton = true, children }: MainHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex items-center">
          {showBackButton && (
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
              <ChevronLeft className="h-6 w-6" />
              <span className="sr-only">Back</span>
            </Button>
          )}
          <h1 className="text-xl font-headline font-bold">{title}</h1>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
            {children}
        </div>
      </div>
    </header>
  );
}
