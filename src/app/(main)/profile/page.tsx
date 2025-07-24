
'use client';
import { getCurrentUser, getUserById, setCurrentUser } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, ChevronRight, Copy, ShieldCheck, Star, Users, Crown, Gift, Store, ShieldQuestion, MessageSquare, Settings, Heart, LogOut, ShieldAlert, Eye } from 'lucide-react';
import Image from "next/image";
import Link from 'next/link';
import { useEffect, useState } from "react";
import type { User } from "@/types";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Stat = ({ value, label, href }: { value: number, label: string, href: string }) => (
  <Link href={href} className="text-center group">
    <p className="text-xl font-bold group-hover:text-primary">{value}</p>
    <p className="text-xs text-muted-foreground group-hover:text-primary">{label}</p>
  </Link>
);

const OtherLink = ({ href, icon: Icon, label, onClick, disabled = false, as, children }: { href?: string, icon: React.ElementType, label: string, onClick?: (e: React.MouseEvent) => void, disabled?: boolean, as?: React.ElementType, children?: React.ReactNode }) => {
    const Component = as || 'div';
    const content = (
        <div className={cn("flex flex-col items-center space-y-2 group", disabled && "opacity-50 pointer-events-none")}>
            <Icon className="w-7 h-7 text-muted-foreground group-hover:text-primary" />
            <span className="text-xs text-center text-muted-foreground group-hover:text-primary">{label}</span>
        </div>
    );
    
    if (href) {
        return <Link href={href} onClick={onClick}>{content}</Link>
    }

    return <Component onClick={onClick}>{children || content}</Component>;
};


export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Always fetch the latest profile from local storage first for speed
        let localUser = getCurrentUser();
        
        if (localUser && localUser.id === firebaseUser.uid) {
            setUser(localUser);
        }

        // Then, fetch from Firestore to get any updates
        const userProfile = await getUserById(firebaseUser.uid);
        if(userProfile){
            setUser(userProfile);
            setCurrentUser(userProfile);
            localUser = userProfile;
        } 
        
        if (!localUser) {
             router.push('/login');
        }
      } else {
        setCurrentUser(null);
        setUser(null);
        router.push('/login');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleCopyId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      toast({
        title: "Copied!",
        description: "Your user ID has been copied to the clipboard.",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUser(null);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      router.push('/login');
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "Could not log you out. Please try again.",
      });
    }
  };


  if (isLoading) {
    return (
        <div className="bg-background">
            <div className="relative h-64">
                <Skeleton className="h-full w-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                <div className="absolute -bottom-16 left-4 right-4">
                    <Card className="shadow-lg bg-card/80 backdrop-blur-sm">
                        <CardContent className="p-4 flex items-center space-x-4">
                            <Skeleton className="w-16 h-16 rounded-full" />
                            <div className="flex-grow space-y-2">
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <div className="pt-20 px-4 pb-4 space-y-6">
                 <div className="grid grid-cols-4 gap-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                 </div>
                 <Skeleton className="h-48 w-full" />
            </div>
        </div>
    )
  }
  
  if (!user) {
    return null; 
  }

  const friendsCount = user.following.filter(id => user.followers.includes(id)).length;
  const visitorsCount = user.visitors?.length || 0;

  return (
    <div className="bg-background">
      <div className="relative h-64">
        <Image 
          src={user.profilePicture}
          alt="Profile background"
          fill
          objectFit="cover"
          data-ai-hint="portrait person"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

        <div className="absolute -bottom-16 left-4 right-4">
          <Card className="shadow-lg bg-card/80 backdrop-blur-sm">
            <Link href="/profile/edit">
              <CardContent className="p-4 flex items-center space-x-4">
                <Avatar className="w-16 h-16 border-4 border-white">
                  <AvatarImage src={user.profilePicture} alt={user.name} data-ai-hint="portrait person" />
                  <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                  <h2 className="text-xl font-bold flex items-center">{user.name} 
                    {user.isCertified && 
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M17.293 5.293a1 1 0 011.414 1.414l-11 11a1 1 0 01-1.414 0l-5-5a1 1 0 011.414-1.414L6 14.586l10.293-10.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    }
                  </h2>
                  <div className="text-xs text-muted-foreground flex items-center">
                    <span>ID: {user.id.substring(0,10)}...</span>
                    <Copy className="w-3 h-3 ml-2 cursor-pointer" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCopyId(); }} />
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </CardContent>
            </Link>
          </Card>
        </div>
      </div>

      <div className="pt-20 px-4 pb-4 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <Stat value={friendsCount} label="Friends" href="/profile/friends" />
          <Stat value={user.following.length} label="Following" href="/profile/following" />
          <Stat value={user.followers.length} label="Followers" href="/profile/followers" />
          <Stat value={visitorsCount} label="Visitors" href="/profile/visitors" />
        </div>
        
        <div className="grid grid-cols-1 gap-4">
            <Button asChild className="w-full bg-red-800 hover:bg-red-900 text-white font-bold py-6 text-base rounded-lg">
                <Link href="/wallet">Recharge</Link>
            </Button>
        </div>

        <Card>
            <CardContent className="p-4">
                <h3 className="font-bold mb-4">Other</h3>
                 <div className="grid grid-cols-4 gap-y-6">
                    <OtherLink 
                        href={user.isCertified ? '#' : '/profile/certification'} 
                        icon={user.isCertified ? ShieldCheck : ShieldAlert} 
                        label={user.isCertified ? "Certified" : "Uncertified"} 
                        disabled={user.isCertified}
                    />
                    <OtherLink href="#" icon={ShieldQuestion} label="Customer service" />
                    <OtherLink href="/settings" icon={Settings} label="Settings" />
                    <AlertDialog>
                       <AlertDialogTrigger asChild>
                         <div className="flex flex-col items-center space-y-2 group cursor-pointer">
                            <LogOut className="w-7 h-7 text-muted-foreground group-hover:text-primary" />
                            <span className="text-xs text-center text-muted-foreground group-hover:text-primary">Logout</span>
                        </div>
                       </AlertDialogTrigger>
                       <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to log out?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleLogout} className="bg-primary hover:bg-primary/90">Logout</AlertDialogAction>
                            </AlertDialogFooter>
                       </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
