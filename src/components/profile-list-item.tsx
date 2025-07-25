
'use client';

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { User } from "@/types";
import { Card } from "./ui/card";
import { findOrCreateConversation, getCurrentUser } from "@/lib/data";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, MessageCircle } from "lucide-react";

interface ProfileListItemProps {
  user: User;
}

export function ProfileListItem({ user }: ProfileListItemProps) {
  const router = useRouter();
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const currentUser = getCurrentUser();
  
  const handleChat = async () => {
      if (!currentUser) return;
      setIsCreatingChat(true);
      const conversationId = await findOrCreateConversation(currentUser.id, user.id);
      setIsCreatingChat(false);
      router.push(`/chat/${conversationId}`);
  };

  return (
    <Card className="p-3">
        <div className="flex items-center space-x-4">
            <Link href={`/profile/${user.id}`} className="block">
                <Image
                src={user.profilePicture}
                alt={user.name}
                width={80}
                height={80}
                className="aspect-square object-cover rounded-lg"
                data-ai-hint="portrait person"
                />
            </Link>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg">{user.name}</h3>
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="bg-pink-100 text-pink-600 border-none text-xs">
                       &#9880; {user.age}
                    </Badge>
                     <Badge variant="secondary" className="bg-green-100 text-green-600 border-none text-xs">
                       13.6km
                    </Badge>
                </div>
            </div>
             <Button onClick={handleChat} disabled={isCreatingChat} variant="ghost" size="icon" className="text-orange-500 hover:text-orange-600">
                {isCreatingChat ? <Loader2 className="h-6 w-6 animate-spin" /> : <MessageCircle className="h-7 w-7"/>}
            </Button>
        </div>
    </Card>
  );
}
