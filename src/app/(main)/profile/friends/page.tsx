
'use client';
import { useState, useEffect } from 'react';
import { getCurrentUser, getUserById } from '@/lib/data';
import type { User } from '@/types';
import { MainHeader } from '@/components/layout/main-header';
import { Skeleton } from '@/components/ui/skeleton';
import { UserListCard } from '@/components/user-list-card';
import { useRouter } from 'next/navigation';

export default function FriendsPage() {
  const [currentUser, setCurrentUserFromState] = useState<User | null>(null);
  const [friends, setFriends] = useState<User[]>([]);
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
    const fetchFriends = async () => {
      if (!currentUser) return;
      setIsLoading(true);
      
      const friendIds = currentUser.following.filter(id => currentUser.followers.includes(id));
      
      const friendProfiles = await Promise.all(
        friendIds.map(id => getUserById(id))
      );

      setFriends(friendProfiles.filter((p): p is User => p !== null));
      setIsLoading(false);
    };

    fetchFriends();
  }, [currentUser]);

  if (isLoading) {
    return (
      <div>
        <MainHeader title="Friends" showBackButton={true} />
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
      <MainHeader title="Friends" showBackButton={true} />
      <div className="p-4 space-y-3">
        {friends.length > 0 ? (
          friends.map(user => <UserListCard key={user.id} user={user} />)
        ) : (
          <div className="flex items-center justify-center h-48">
            <p className="text-muted-foreground">You don't have any friends yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
