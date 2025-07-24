
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { User } from "@/types";
import { Card } from "./ui/card";

interface ProfileListItemProps {
  user: User;
}

export function ProfileListItem({ user }: ProfileListItemProps) {
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
            <Link href={`/chat/convo-placeholder`}>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6">
                    Chat
                </Button>
            </Link>
        </div>
    </Card>
  );
}
