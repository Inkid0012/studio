import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { currentUser, getConversationsForUser } from "@/lib/data";
import { MainHeader } from "@/components/layout/main-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ChatListPage() {
  const conversations = getConversationsForUser(currentUser.id);

  return (
    <div>
      <MainHeader title="Chats" showBackButton={false} />
      <div className="p-4 space-y-2">
        {conversations.map((convo) => {
          const otherUser = convo.participants.find(p => p.id !== currentUser.id);
          const lastMessage = convo.messages[convo.messages.length - 1];
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
                    <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(lastMessage.timestamp, { addSuffix: true })}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{lastMessage.text}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
