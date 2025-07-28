
import Link from "next/link";
import Image from "next/image";
import type { User } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

interface ProfileCardProps {
  user: User;
}

export function ProfileCard({ user }: ProfileCardProps) {
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
            <div className="absolute bottom-2 left-3 text-white">
                <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-lg drop-shadow-md">{user.name}</h3>
                    {user.isCertified && (
                        <ShieldCheck className="h-5 w-5 text-green-400 fill-green-900/50" />
                    )}
                </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
