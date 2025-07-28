
'use client';

import Link from "next/link";
import Image from "next/image";
import type { User } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, MessageSquare, ShieldCheck, Loader2 } from "lucide-react";
import { Badge } from "./ui/badge";
import { getDistance, findOrCreateConversation } from "@/lib/data";
import { Button } from "./ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProfileCardProps {
  user: User;
  currentUser: User | null;
}

const calculateAge = (dob: string | Date) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};


export function ProfileCard({ user, currentUser }: ProfileCardProps) {
  const userAge = calculateAge(user.dob);
  const router = useRouter();
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  let distance: string | null = null;
  if (currentUser?.location && user.location) {
    distance = getDistance(currentUser.location, user.location).toFixed(1);
  }

  const handleChatClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) return;

    setIsCreatingChat(true);
    try {
        const conversationId = await findOrCreateConversation(currentUser.id, user.id);
        router.push(`/chat/${conversationId}`);
    } catch (error) {
        console.error("Failed to start chat from profile card:", error);
    } finally {
        setIsCreatingChat(false);
    }
  };

  return (
    <Link href={`/profile/${user.id}`} className="block group">
      <Card className="overflow-hidden transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:-translate-y-1 bg-white rounded-[16px]">
        <CardContent className="p-0">
          <div className="aspect-square relative">
            <Image
              src={user.profilePicture}
              alt={user.name}
              fill
              className="object-cover w-full h-full"
              data-ai-hint="portrait person"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
             <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2 w-9 h-9 bg-black/30 text-white rounded-full hover:bg-black/50 hover:text-white"
                onClick={handleChatClick}
                disabled={isCreatingChat}
              >
                {isCreatingChat ? <Loader2 className="animate-spin" /> : <MessageSquare className="w-5 h-5" />}
              </Button>

            <div className="absolute bottom-2 left-3 text-white w-full pr-4">
                <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm drop-shadow-md">{user.name}</h3>
                    {user.isCertified && (
                        <ShieldCheck className="h-4 w-4 text-green-400 fill-green-900/50" />
                    )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-cyan-400/80 text-black border-none text-xs h-5">
                       {user.gender === 'male' ? '♂' : '♀'} {userAge}
                    </Badge>
                    {distance !== null && (
                     <Badge className="bg-lime-400/80 text-black border-none text-xs h-5 flex items-center gap-1">
                       <MapPin className="h-3 w-3" /> {distance}km
                    </Badge>
                    )}
                </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
