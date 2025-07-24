
'use client';
import { useState, useEffect } from 'react';
import { getCurrentUser, getUserById } from '@/lib/data';
import type { User } from '@/types';
import { MainHeader } from '@/components/layout/main-header';
import { Skeleton } from '@/components/ui/skeleton';
import { UserListCard } from '@/components/user-list-card';
import { useRouter } from 'next/navigation';

export default function FollowersPage() {
  const [currentUser, setCurrentUserFromState] = useState<User | null>(null);
  const [followers, setFollowers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUserFromState(user);
    } else {
        router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    const fetchFollowers = async () => {
      if (!currentUser) return;
      setIsLoading(true);
      const followerProfiles = await Promise.all(
        currentUser.followers.map(id => getUserById(id))
      );
      setFollowers(followerProfiles.filter((p): p is User => p !== null));
      setIsLoading(false);
    };

    fetchFollowers();
  }, [currentUser]);

  if (isLoading) {
    return (
      <div>
        <MainHeader title="Followers" showBackButton={true} />
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <MainHeader title="Followers" showBackButton={true} />
      <div className="p-4 space-y-3">
        {followers.length > 0 ? (
          followers.map(user => <UserListCard key={user.id} user={user} />)
        ) : (
          <div className="flex items-center justify-center h-48">
            <p className="text-muted-foreground">You don't have any followers yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
