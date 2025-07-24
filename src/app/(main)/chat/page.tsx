
'use client'

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { getCurrentUser, getConversationsForUser } from "@/lib/data";
import { MainHeader } from "@/components/layout/main-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import type { Conversation, User } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function ChatListPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    setIsLoading(false);
  }, []);
  
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = getConversationsForUser(currentUser.id, (convos) => {
      setConversations(convos);
    });

    return () => unsubscribe();
  }, [currentUser]);

  if (!currentUser && !isLoading) {
    return <div>Loading...</div>
  }

  const showPlaceholder = !isLoading && conversations.length === 0;

  return (
    <div>
      <MainHeader title="Chats" showBackButton={false} />
      <div className="p-4 space-y-4">
        <Alert variant="destructive" className="bg-orange-100 border-orange-200 text-orange-800">
          <ShieldAlert className="h-4 w-4 !text-orange-800" />
          <AlertTitle className="font-bold">Stay Safe!</AlertTitle>
          <AlertDescription>
            Avoid sharing personal information like phone numbers or addresses to prevent any issues.
          </AlertDescription>
        </Alert>
        
        <Separator />

        {showPlaceholder ? (
            <div className="flex items-center justify-center h-48">
                <p className="text-muted-foreground">[ chats will appear here ]</p>
            </div>
        ) : (
            <div className="space-y-2">
                {conversations.map((convo) => {
                const otherUser = convo.participants.find(p => p.id !== currentUser?.id);
                const lastMessage = convo.lastMessage;
                if (!otherUser) return null;

                return (
                    <Link href={`/chat/${convo.id}`} key={convo.id} className="block">
                    <div className="flex items-center p-3 rounded-lg hover:bg-primary/5 transition-colors">
                        <Avatar className="h-14 w-14">
                        <AvatarImage src={otherUser.profilePicture} alt={otherUser.name} data-ai-hint="portrait person" />
                        <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="ml-4 flex-1">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold font-headline">{otherUser.name}</h3>
                            {lastMessage?.timestamp && (
                                <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(lastMessage.timestamp.toDate(), { addSuffix: true })}
                                </p>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{lastMessage?.text || 'No messages yet'}</p>
                        </div>
                    </div>
                    </Link>
                );
                })}
            </div>
        )}
      </div>
    </div>
  );
}
