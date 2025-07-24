
'use client';
import { useState, useEffect } from 'react';
import { getCurrentUser, getUserById } from '@/lib/data';
import type { User } from '@/types';
import { MainHeader } from '@/components/layout/main-header';
import { Skeleton } from '@/components/ui/skeleton';
import { UserListCard } from '@/components/user-list-card';
import { useRouter } from 'next/navigation';

export default function FollowingPage() {
  const [currentUser, setCurrentUserFromState] = useState<User | null>(null);
  const [following, setFollowing] = useState<User[]>([]);
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
    const fetchFollowing = async () => {
      if (!currentUser) return;
      setIsLoading(true);
      const followingProfiles = await Promise.all(
        currentUser.following.map(id => getUserById(id))
      );
      setFollowing(followingProfiles.filter((p): p is User => p !== null));
      setIsLoading(false);
    };

    fetchFollowing();
  }, [currentUser]);

  const handleFollowChange = (userId: string, isFollowing: boolean) => {
    if (!isFollowing) {
        setFollowing(prev => prev.filter(user => user.id !== userId));
    }
  };

  if (isLoading) {
    return (
      <div>
        <MainHeader title="Following" showBackButton={true} />
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
      <MainHeader title="Following" showBackButton={true} />
      <div className="p-4 space-y-3">
        {following.length > 0 ? (
          following.map(user => <UserListCard key={user.id} user={user} onFollowChange={handleFollowChange} />)
        ) : (
          <div className="flex items-center justify-center h-48">
            <p className="text-muted-foreground">You are not following anyone yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
