
import Link from "next/link";
import Image from "next/image";
import type { User } from "@/types";
import { Card, CardContent } from "@/components/ui/card";

interface ProfileCardProps {
  user: User;
}

export function ProfileCard({ user }: ProfileCardProps) {
  return (
    <Link href={`/profile/${user.id}`} className="block group">
      <Card className="overflow-hidden transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:-translate-y-1">
        <CardContent className="p-0">
          <Image
            src={user.profilePicture}
            alt={user.name}
            width={500}
            height={500}
            className="aspect-square object-cover w-full"
            data-ai-hint="portrait person"
          />
        </CardContent>
      </Card>
      <div className="mt-2 text-center">
        <h3 className="font-semibold text-foreground">{user.name}</h3>
      </div>
    </Link>
  );
}
