
'use client';

import { getDiscoverProfiles, getCurrentUser, CHARGE_COSTS, seedInitialUsers } from "@/lib/data";
import { MainHeader } from "@/components/layout/main-header";
import { useEffect, useState } from "react";
import { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ProfileCard } from "@/components/profile-card";
import { useRouter } from "next/navigation";
import { findOrCreateConversation } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";

export default function DiscoverPage() {
  const [allProfiles, setAllProfiles] = useState<User[]>([]);
  const [displayedProfiles, setDisplayedProfiles] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const currentUser = getCurrentUser();


  useEffect(() => {
    const fetchProfiles = async () => {
      setIsLoading(true);
      await seedInitialUsers();
      // Fetch all users without filtering by passing `forSearch = true`
      const fetchedProfiles = await getDiscoverProfiles(currentUser?.id, true); 
      setAllProfiles(fetchedProfiles);
      setDisplayedProfiles(fetchedProfiles);
      setIsLoading(false);
    };
    fetchProfiles();
  }, [currentUser?.id]);
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
        setDisplayedProfiles(allProfiles);
        setSearchOpen(false);
        return;
    }
    
    setIsLoading(true);
    setIsSearching(true);
    setSearchOpen(false);

    const lowerCaseQuery = searchQuery.toLowerCase();
    
    const results = allProfiles.filter(user => 
        user.name.toLowerCase().includes(lowerCaseQuery) ||
        user.id.toLowerCase().includes(lowerCaseQuery)
    );
    
    setDisplayedProfiles(results);
    setIsLoading(false);
    setIsSearching(false);
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

    const conversationId = await findOrCreateConversation(
      currentUser.id,
      randomUser.id
    );

    router.push(`/call/${conversationId}?otherUserId=${randomUser.id}`);
  };

  const showPlaceholder = !isLoading && displayedProfiles.length === 0;

  return (
    <div>
      <MainHeader title="Discover" showBackButton={false}>
         <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Search className="h-6 w-6"/>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Search Users</DialogTitle>
                </DialogHeader>
                <div className="flex items-center space-x-2">
                    <Input
                        placeholder="Search by name or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button type="submit" onClick={handleSearch} disabled={isLoading}>
                        {isSearching ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Search'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
      </MainHeader>
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
                <div className="text-left text-sm text-muted-foreground mt-4 bg-muted p-4 rounded-lg">
                    <h3 className="font-bold mb-2">Possible Reasons:</h3>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>The 'users' collection does not exist or is empty in your Firestore database.</li>
                        <li>Your Firestore Security Rules are preventing read access to the 'users' collection.</li>
                        <li>The Firebase project configuration in your application is incorrect.</li>
                    </ul>
                </div>
            </div>
        ) : (
            <div className="grid grid-cols-2 gap-4">
                {displayedProfiles.map((user) => (
                    <Card key={user.id}>
                        <CardContent className="p-4 text-center">
                            <h3 className="font-semibold text-foreground">{user.name}</h3>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
