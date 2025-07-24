
'use client';
import { notFound, useParams, useRouter } from 'next/navigation';
import { getUserById, addVisitor, getCurrentUser, findOrCreateConversation } from '@/lib/data';
import { MainHeader } from '@/components/layout/main-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, MoreVertical, MessageSquare, ShieldAlert, XCircle, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useEffect, useState } from 'react';
import type { User } from '@/types';

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const [user, setUser] = useState<User | null>(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const currentUser = getCurrentUser();

  useEffect(() => {
    const fetchUser = async () => {
      const userProfile = await getUserById(userId);
      if (userProfile) {
        setUser(userProfile);
        // Track the visit if it's not the user's own profile
        if (currentUser && currentUser.id !== userId) {
          await addVisitor(userId, currentUser.id);
        }
      } else {
        notFound();
      }
    };

    fetchUser();
  }, [userId, currentUser]);

  if (!user || !currentUser) {
    return <div>Loading profile...</div>; // Or a skeleton loader
  }

  const handleChat = async () => {
      setIsCreatingChat(true);
      const conversationId = await findOrCreateConversation(currentUser.id, user.id);
      setIsCreatingChat(false);
      router.push(`/chat/${conversationId}`);
  };

  const canChat = currentUser.id !== user.id && currentUser.gender !== user.gender;

  return (
    <div>
      <MainHeader title={user.name} showBackButton={true}>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <MoreVertical className="h-6 w-6" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem>
                    <XCircle className="mr-2 h-4 w-4 text-destructive" />
                    <span>Block User</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <ShieldAlert className="mr-2 h-4 w-4 text-destructive" />
                    <span>Report User</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </MainHeader>

      <div className="p-4 space-y-6">
        <Card className="shadow-lg">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <Avatar className="w-32 h-32 border-4 border-accent mb-4">
              <AvatarImage src={user.profilePicture} alt={user.name} data-ai-hint="portrait person" />
              <AvatarFallback className="text-4xl">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex items-center">
                <h2 className="text-3xl font-bold font-headline">{user.name}, {user.age}</h2>
                {user.isCertified && <CheckCircle className="ml-2 h-6 w-6 text-accent fill-primary" />}
            </div>
            <p className="text-muted-foreground mt-2">{user.gender}</p>
          </CardContent>
        </Card>

        {canChat && (
          <Button onClick={handleChat} disabled={isCreatingChat} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold py-6 text-base">
                {isCreatingChat ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                    <MessageSquare className="mr-2 h-5 w-5"/>
                )}
                Send Message
          </Button>
        )}

        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl">About {user.name}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground font-body">{user.bio}</p>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Interests</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
                {user.interests.map(interest => (
                    <Badge key={interest} variant="secondary" className="text-base py-1 px-3 bg-accent/20 text-accent-foreground border-accent/30">{interest}</Badge>
                ))}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
