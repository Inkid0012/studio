
import Link from "next/link";
import Image from "next/image";
import type { User } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import { Badge } from "./ui/badge";
import { getDistance } from "@/lib/data";

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

  let distance: string | null = null;
  if (currentUser?.location && user.location) {
    distance = getDistance(currentUser.location, user.location).toFixed(1);
  }

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
                     <Badge className="bg-lime-400/80 text-black border-none text-xs h-5">
                       {distance}km
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
