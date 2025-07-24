
'use client';

import { getDiscoverProfiles } from "@/lib/data";
import { ProfileCard } from "@/components/profile-card";
import { MainHeader } from "@/components/layout/main-header";
import { FizuLogo } from "@/components/icons/fizu-logo";
import { useEffect, useState } from "react";
import { User } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function DiscoverPage() {
  const [profiles, setProfiles] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      setIsLoading(true);
      const fetchedProfiles = await getDiscoverProfiles();
      setProfiles(fetchedProfiles);
      setIsLoading(false);
    };
    fetchProfiles();
  }, []);

  return (
    <div>
      <MainHeader title="Discover" showBackButton={false}>
        <FizuLogo className="text-3xl" />
      </MainHeader>
      <div className="p-4">
        {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                ))}
            </div>
        ) : (
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {profiles.map((user) => (
                    <ProfileCard key={user.id} user={user} />
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
