
'use client';
import { useState, useEffect } from 'react';
import { getCurrentUser, getUserById } from '@/lib/data';
import type { User, Visitor } from '@/types';
import { MainHeader } from '@/components/layout/main-header';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface VisitorInfo {
  user: User;
  timestamp: string;
}

export default function VisitorsPage() {
  const [currentUser, setCurrentUserFromState] = useState<User | null>(null);
  const [visitors, setVisitors] = useState<VisitorInfo[]>([]);
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
    const fetchVisitors = async () => {
      if (!currentUser) return;
      setIsLoading(true);

      const sortedVisitors = [...currentUser.visitors].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      const visitorProfiles = await Promise.all(
        sortedVisitors.map(async (visitor: Visitor) => {
          const profile = await getUserById(visitor.userId);
          return profile ? { user: profile, timestamp: visitor.timestamp } : null;
        })
      );
      setVisitors(visitorProfiles.filter((p): p is VisitorInfo => p !== null));
      setIsLoading(false);
    };

    if (currentUser) {
      fetchVisitors();
    }
  }, [currentUser]);

  if (isLoading) {
    return (
      <div>
        <MainHeader title="Visitors" showBackButton={true} />
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
      <MainHeader title="Visitors" showBackButton={true} />
      <div className="p-4 space-y-3">
        {visitors.length > 0 ? (
          visitors.map(visitorInfo => (
            <Card key={visitorInfo.user.id} className="p-3 w-full">
               <Link href={`/profile/${visitorInfo.user.id}`} className="flex items-center space-x-4">
                  <Avatar className="h-14 w-14">
                      <AvatarImage src={visitorInfo.user.profilePicture} alt={visitorInfo.user.name} data-ai-hint="portrait person" />
                      <AvatarFallback>{visitorInfo.user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                      <h3 className="font-bold text-lg">{visitorInfo.user.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Viewed {formatDistanceToNow(new Date(visitorInfo.timestamp), { addSuffix: true })}
                      </p>
                  </div>
              </Link>
            </Card>
          ))
        ) : (
          <div className="flex items-center justify-center h-48">
            <p className="text-muted-foreground">No one has visited your profile yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
