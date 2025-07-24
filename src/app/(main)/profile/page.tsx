import { currentUser } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, ChevronRight, Copy, ShieldCheck, Star, Users, Crown, Gift, Store, ShieldQuestion, MessageSquare, Settings, Heart } from 'lucide-react';
import Image from "next/image";
import Link from 'next/link';

const Stat = ({ value, label }: { value: number, label: string }) => (
  <div className="text-center">
    <p className="text-xl font-bold">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

const IconLink = ({ href, icon: Icon, label, hasNotification = false }: { href: string, icon: React.ElementType, label: string, hasNotification?: boolean }) => (
  <Link href={href} className="flex flex-col items-center space-y-2">
    <div className="relative">
      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-primary/10">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      {hasNotification && <div className="absolute top-0 right-0 w-3 h-3 rounded-full bg-red-500 border-2 border-background" />}
    </div>
    <span className="text-xs text-foreground">{label}</span>
  </Link>
);


const OtherLink = ({ href, icon: Icon, label }: { href: string, icon: React.ElementType, label: string }) => (
  <Link href={href} className="flex flex-col items-center space-y-2 group">
    <Icon className="w-7 h-7 text-muted-foreground group-hover:text-primary" />
    <span className="text-xs text-center text-muted-foreground group-hover:text-primary">{label}</span>
  </Link>
);

export default function ProfilePage() {
  const user = currentUser;

  return (
    <div className="bg-background">
      <div className="relative h-64">
        <Image 
          src={user.profilePicture}
          alt="Profile background"
          layout="fill"
          objectFit="cover"
          className="blur-sm"
          data-ai-hint="portrait person"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

        <div className="absolute -bottom-16 left-4 right-4">
          <Card className="shadow-lg bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4 flex items-center space-x-4">
              <Avatar className="w-16 h-16 border-4 border-white">
                <AvatarImage src={user.profilePicture} alt={user.name} data-ai-hint="portrait person" />
                <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-grow">
                <h2 className="text-xl font-bold flex items-center">{user.name} 
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M17.293 5.293a1 1 0 011.414 1.414l-11 11a1 1 0 01-1.414 0l-5-5a1 1 0 011.414-1.414L6 14.586l10.293-10.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </h2>
                <div className="text-xs text-muted-foreground flex items-center">
                  <span>ID: 870555909</span>
                  <Copy className="w-3 h-3 ml-2 cursor-pointer" />
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="pt-20 px-4 pb-4 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <Stat value={user.friends} label="Friends" />
          <Stat value={user.following} label="Following" />
          <Stat value={user.followers} label="Followers" />
          <Stat value={user.visitors} label="Visitors" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-6 text-base rounded-lg">
            Recharge
          </Button>
          <Button variant="outline" className="w-full font-bold py-6 text-base rounded-lg border-none bg-gradient-to-r from-yellow-400 to-amber-500 text-white flex items-center justify-between">
            <span>VIP/SVIP</span>
            <Image src="https://placehold.co/32x32.png" alt="VIP" width={24} height={24} data-ai-hint="diamond gem" />
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-4 py-4">
            <IconLink href="#" icon={Users} label="Family" hasNotification />
            <IconLink href="#" icon={Store} label="Store" />
            <IconLink href="#" icon={Crown} label="Aristocracy" />
            <IconLink href="/profile/edit" icon={Heart} label="Interests" />
        </div>

        <Card>
            <CardContent className="p-4">
                <h3 className="font-bold mb-4">Other</h3>
                 <div className="grid grid-cols-4 gap-y-6">
                    <OtherLink href="#" icon={Briefcase} label="Bag" />
                    <OtherLink href="#" icon={Star} label="Level" />
                    <OtherLink href="#" icon={Gift} label="Badge" />
                    <OtherLink href="#" icon={ShieldCheck} label="Uncertified" />
                    <OtherLink href="#" icon={ShieldQuestion} label="Customer service" />
                    <OtherLink href="#" icon={MessageSquare} label="User Feedback" />
                    <OtherLink href="/settings" icon={Settings} label="Settings" />
                    <div className="flex flex-col items-center space-y-2 group">
                      <Image src="https://placehold.co/40x40.png" alt="romance" width={28} height={28} data-ai-hint="couple romance" />
                      <span className="text-xs text-center text-muted-foreground group-hover:text-primary">Love</span>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
