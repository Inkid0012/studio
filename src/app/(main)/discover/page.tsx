
'use client';

import { getDiscoverProfiles, getCurrentUser, getDistance } from "@/lib/data";
import { useEffect, useState } from "react";
import { User } from "@/types";
import { Loader2 } from "lucide-react";
import { ProfileCard } from "@/components/profile-card";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { InkSplashIcon } from "@/components/icons/ink-splash-icon";
import { PermissionsBanner } from "@/components/permissions-banner";

export default function DiscoverPage() {
  const [allProfiles, setAllProfiles] = useState<User[]>([]);
  const [displayedProfiles, setDisplayedProfiles] = useState<User[]>([]);
  const [nearbyProfiles, setNearbyProfiles] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("recommended");
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const auth = getAuth(app);
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const localUser = await getCurrentUser(); // Fetch up-to-date user with location
        setCurrentUser(localUser);
        
        try {
            const fetchedProfiles = await getDiscoverProfiles(user.uid, true); 
            setAllProfiles(fetchedProfiles);
            setDisplayedProfiles(fetchedProfiles);

            if (localUser?.location) {
                const nearby = fetchedProfiles.filter(p => {
                    if (p.location) {
                        return getDistance(localUser.location, p.location) < 30;
                    }
                    return false;
                });
                setNearbyProfiles(nearby);
            }

        } catch (err) {
            console.error("Error fetching discover items:", err);
        } finally {
            setIsLoading(false);
        }
      } else {
        setCurrentUser(null);
        setIsLoading(false);
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const profilesToShow = activeTab === 'recommended' ? displayedProfiles : nearbyProfiles;
  const showPlaceholder = !isLoading && profilesToShow.length === 0;

  return (
    <div className="pt-4">
      <PermissionsBanner />
      <div className="px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-transparent p-0">
                <TabsTrigger value="recommended" className="relative text-base data-[state=active]:font-bold data-[state=active]:text-primary data-[state=inactive]:text-muted-foreground py-2 focus-visible:ring-0 focus-visible:ring-offset-0">
                   <InkSplashIcon className="absolute top-0 left-5 text-red-500 opacity-70 transform -rotate-12" />
                   <span className="mx-2">Recommend</span>
                   <InkSplashIcon className="absolute bottom-0 right-4 text-green-500 opacity-70 transform rotate-6" />
                </TabsTrigger>
                <TabsTrigger value="nearby" className="relative text-base data-[state=active]:font-bold data-[state=active]:text-primary data-[state=inactive]:text-muted-foreground py-2 focus-visible:ring-0 focus-visible:ring-offset-0">
                   <InkSplashIcon className="absolute top-0 right-5 text-purple-600 opacity-60 transform rotate-12" />
                   <span className="mx-2">Nearby</span>
                   <InkSplashIcon className="absolute bottom-0 left-4 text-pink-300 opacity-70 transform -rotate-6" />
                </TabsTrigger>
            </TabsList>
            <TabsContent value="recommended">
                {/* Content rendered below */}
            </TabsContent>
            <TabsContent value="nearby">
                {/* Content rendered below */}
            </TabsContent>
        </Tabs>
      </div>
      <div className="p-4">
        {isLoading ? (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary"/>
            </div>
        ) : showPlaceholder ? (
            <div className="flex flex-col items-center justify-center h-96 text-center">
                <p className="text-lg font-semibold">No Users Found</p>
                <p className="text-muted-foreground mt-2">
                    {activeTab === 'recommended' 
                        ? "There are no recommended profiles for you right now."
                        : "No users found within 30km. Try expanding your range."
                    }
                </p>
            </div>
        ) : (
            <div className="grid grid-cols-2 gap-4">
                {profilesToShow.map((user) => (
                    <ProfileCard key={user.id} user={user} currentUser={currentUser} />
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
