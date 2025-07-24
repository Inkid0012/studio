import Link from "next/link";
import Image from "next/image";
import { CheckCircle } from "lucide-react";
import type { User } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ProfileCardProps {
  user: User;
}

export function ProfileCard({ user }: ProfileCardProps) {
  return (
    <Link href={`/profile/${user.id}`} className="block group">
      <Card className="overflow-hidden transition-all duration-300 ease-in-out group-hover:shadow-lg group-hover:shadow-accent/20 group-hover:-translate-y-1">
        <CardContent className="p-0">
          <div className="relative">
            <Image
              src={user.profilePicture}
              alt={user.name}
              width={500}
              height={500}
              className="aspect-square object-cover w-full"
              data-ai-hint="portrait person"
            />
            <div className="absolute bottom-0 left-0 w-full h-2/5 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-0 left-0 p-4 text-white">
              <div className="flex items-center">
                <h3 className="text-xl font-bold font-headline">{user.name}, {user.age}</h3>
                {user.isCertified && <CheckCircle className="ml-2 h-5 w-5 text-accent fill-white" />}
              </div>
              <p className="text-sm font-body truncate">{user.bio}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
