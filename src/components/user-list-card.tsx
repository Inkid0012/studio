
'use client';

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { User } from "@/types";
import { Card } from "./ui/card";
import { followUser, unfollowUser, getCurrentUser, setCurrentUser } from "@/lib/data";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface UserListCardProps {
  user: User;
  onFollowChange?: (userId: string, isFollowing: boolean) => void;
}

export function UserListCard({ user, onFollowChange }: UserListCardProps) {
  const [currentUser, setCurrentUserFromState] = useState(getCurrentUser());
  const [isProcessing, setIsProcessing] = useState(false);

  if (!currentUser) {
    return null; // Or some other placeholder
  }
  
  const isFollowing = currentUser.following.includes(user.id);

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
        if (isFollowing) {
            await unfollowUser(currentUser.id, user.id);
            const updatedUser = {
                ...currentUser,
                following: currentUser.following.filter(id => id !== user.id)
            };
            setCurrentUserFromState(updatedUser);
            setCurrentUser(updatedUser);
        } else {
            await followUser(currentUser.id, user.id);
             const updatedUser = {
                ...currentUser,
                following: [...currentUser.following, user.id]
            };
            setCurrentUserFromState(updatedUser);
            setCurrentUser(updatedUser);
        }
        onFollowChange?.(user.id, !isFollowing);
    } catch (error) {
        console.error("Failed to update follow status", error);
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <Card className="p-3 w-full">
        <div className="flex items-center space-x-4">
            <Link href={`/profile/${user.id}`} className="flex items-center space-x-4 flex-1">
                <Avatar className="h-14 w-14">
                    <AvatarImage src={user.profilePicture} alt={user.name} data-ai-hint="portrait person" />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <h3 className="font-bold text-lg">{user.name}</h3>
                    <p className="text-sm text-muted-foreground truncate max-w-[150px]">{user.bio}</p>
                </div>
            </Link>
            
            {user.id !== currentUser.id && (
                 <Button 
                    onClick={handleFollowToggle} 
                    variant={isFollowing ? 'outline' : 'default'}
                    className="rounded-full px-6"
                    disabled={isProcessing}
                >
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : (isFollowing ? 'Following' : 'Follow')}
                 </Button>
            )}
        </div>
    </Card>
  );
}
