
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

export default function DiscoverPage() {
  const [allProfiles, setAllProfiles] = useState<User[]>([]);
  const [displayedProfiles, setDisplayedProfiles] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);


  useEffect(() => {
    const fetchProfiles = async () => {
      setIsLoading(true);
      await seedInitialUsers();
      // Fetch all users without filtering by gender
      const fetchedProfiles = await getDiscoverProfiles(undefined, true); 
      setAllProfiles(fetchedProfiles);
      setDisplayedProfiles(fetchedProfiles);
      setIsLoading(false);
    };
    fetchProfiles();
  }, []);
  
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
            <div className="flex items-center justify-center h-96">
                <p className="text-muted-foreground">No users found.</p>
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
