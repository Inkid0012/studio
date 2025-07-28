
'use client';

import { getDiscoverProfiles, getCurrentUser } from "@/lib/data";
import { useEffect, useState } from "react";
import { User } from "@/types";
import { Loader2 } from "lucide-react";
import { ProfileCard } from "@/components/profile-card";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";
import { SearchDialog } from "@/components/search-dialog";


export default function DiscoverPage() {
  const [allProfiles, setAllProfiles] = useState<User[]>([]);
  const [displayedProfiles, setDisplayedProfiles] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);


  useEffect(() => {
    const auth = getAuth(app);
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const localUser = getCurrentUser();
        // Use local user data if it exists and matches, to avoid re-fetching
        if(localUser && localUser.id === user.uid) {
            setCurrentUser(localUser);
        } else {
            setCurrentUser(user);
        }
        
        try {
            const fetchedProfiles = await getDiscoverProfiles(user.uid, true); 
            setAllProfiles(fetchedProfiles);
            setDisplayedProfiles(fetchedProfiles);
        } catch (err) {
            console.error("Error fetching discover items:", err);
        } finally {
            setIsLoading(false);
        }
      } else {
        // Handle case where user is not logged in
        setCurrentUser(null);
        setIsLoading(false);
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);
  
  const handleSearch = async (searchQuery: string) => {
    setIsLoading(true);

    if (!searchQuery.trim()) {
        setDisplayedProfiles(allProfiles);
        setIsLoading(false);
        return;
    }

    const lowerCaseQuery = searchQuery.toLowerCase();
    
    const results = allProfiles.filter(user => 
        user.name.toLowerCase().includes(lowerCaseQuery) ||
        user.id.toLowerCase().includes(lowerCaseQuery)
    );
    
    setDisplayedProfiles(results);
    setIsLoading(false);
  };
  
    const handleRandomCall = async () => {
    if (!currentUser) return;

    const oppositeGenderProfiles = allProfiles.filter(
      (p) => p.gender !== currentUser.gender && p.id !== currentUser.id && p.gender !== 'other'
    );

    if (oppositeGenderProfiles.length === 0) {
      alert("No users of the opposite gender found to start a random call.");
      return;
    }

    const randomUser =
      oppositeGenderProfiles[
        Math.floor(Math.random() * oppositeGenderProfiles.length)
      ];

    // Placeholder for startCall functionality
    router.push(`/call/some-call-id?otherUserId=${randomUser.id}&callType=outgoing`);
  };

  const showPlaceholder = !isLoading && displayedProfiles.length === 0;

  return (
    <div className="pt-4">
      <div className="p-4">
        {isLoading ? (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary"/>
            </div>
        ) : showPlaceholder ? (
            <div className="flex flex-col items-center justify-center h-96 text-center">
                <p className="text-lg font-semibold">No Users Found</p>
                <p className="text-muted-foreground mt-2">
                    This screen is connected to the 'users' collection in Firestore, but no documents were returned.
                </p>
            </div>
        ) : (
            <div className="grid grid-cols-2 gap-4">
                {displayedProfiles.map((user) => (
                    <ProfileCard key={user.id} user={user} />
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
