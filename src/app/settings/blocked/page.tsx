
'use client';
import { useState, useEffect } from 'react';
import { getCurrentUser, getUserById } from '@/lib/data';
import type { User } from '@/types';
import { MainHeader } from '@/components/layout/main-header';
import { Skeleton } from '@/components/ui/skeleton';
import { UserListCard } from '@/components/user-list-card';
import { useRouter } from 'next/navigation';

export default function BlockedListPage() {
  const [currentUser, setCurrentUserFromState] = useState<User | null>(null);
  const [blockedUsers, setBlockedUsers] = useState<User[]>([]);
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
    const fetchBlockedUsers = async () => {
      if (!currentUser || !currentUser.blockedUsers) {
          setIsLoading(false);
          return;
      };
      setIsLoading(true);
      const blockedProfiles = await Promise.all(
        currentUser.blockedUsers.map(id => getUserById(id))
      );
      setBlockedUsers(blockedProfiles.filter((p): p is User => p !== null));
      setIsLoading(false);
    };

    fetchBlockedUsers();
  }, [currentUser]);

  const handleUnblock = (userId: string) => {
    setBlockedUsers(prev => prev.filter(user => user.id !== userId));
  };


  if (isLoading) {
    return (
      <div>
        <MainHeader title="Blocked List" showBackButton={true} />
        <div className="p-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <MainHeader title="Blocked List" showBackButton={true} />
      <div className="p-4 space-y-3">
        {blockedUsers.length > 0 ? (
          blockedUsers.map(user => <UserListCard key={user.id} user={user} onFollowChange={handleUnblock} />)
        ) : (
          <div className="flex items-center justify-center h-48">
            <p className="text-muted-foreground">You haven't blocked anyone.</p>
          </div>
        )}
      </div>
    </div>
  );
}
