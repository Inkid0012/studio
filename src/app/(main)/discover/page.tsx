
'use client';

import { getDiscoverProfiles, getCurrentUser, CHARGE_COSTS, seedInitialUsers } from "@/lib/data";
import { MainHeader } from "@/components/layout/main-header";
import { useEffect, useState } from "react";
import { User } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle, Search, Wallet, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileListItem } from "@/components/profile-list-item";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function DiscoverPage() {
  const [allProfiles, setAllProfiles] = useState<User[]>([]);
  const [displayedProfiles, setDisplayedProfiles] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfiles = async () => {
      setIsLoading(true);
      await seedInitialUsers(); // Ensure users are seeded
      const currentUser = getCurrentUser();
      const fetchedProfiles = await getDiscoverProfiles(currentUser?.id);
      setAllProfiles(fetchedProfiles);
      setDisplayedProfiles(fetchedProfiles);
      setIsLoading(false);
    };
    fetchProfiles();
  }, []);
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
        setDisplayedProfiles(allProfiles);
        setIsSearching(false);
        setSearchOpen(false);
        return;
    }
    
    setIsLoading(true);
    setIsSearching(true);
    setSearchOpen(false);

    const lowerCaseQuery = searchQuery.toLowerCase();
    
    const currentUser = getCurrentUser();
    const allUsers = await getDiscoverProfiles(currentUser?.id, true); 
    const results = allUsers.filter(user => 
        user.name.toLowerCase().includes(lowerCaseQuery) ||
        user.id.toLowerCase().includes(lowerCaseQuery)
    );
    
    setDisplayedProfiles(results);
    setIsLoading(false);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setDisplayedProfiles(allProfiles);
    setIsSearching(false);
  };
  
  const handleVoiceChat = () => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
        return;
    }
    if (currentUser.coins < CHARGE_COSTS.call) {
        toast({ variant: 'destructive', title: 'Insufficient Coins', description: `You need at least ${CHARGE_COSTS.call} coins to make a call.`});
        return;
    }
    const randomUser = displayedProfiles[0];
    if (!randomUser) {
        toast({ variant: 'destructive', title: 'No users available', description: 'Could not find a user to call right now.' });
        return;
    }
    const conversationId = [currentUser.id, randomUser.id].sort().join('-');
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
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Search'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
      </MainHeader>
      <div className="p-4 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-[#800000] text-white shadow-lg overflow-hidden cursor-pointer" onClick={handleVoiceChat}>
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <h3 className="font-bold text-lg">Voice Chat</h3>
              <div className="flex justify-end">
                <PlayCircle className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Link href="/wallet">
            <Card className="bg-green-600 text-white shadow-lg overflow-hidden">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <h3 className="font-bold text-lg">Recharge</h3>
                 <div className="flex justify-end">
                  <Wallet className="w-8 h-8 opacity-80" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <Tabs defaultValue="recommend" className="w-full">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="recommend">Recommend</TabsTrigger>
              <TabsTrigger value="newcomer">Newcomer</TabsTrigger>
              <TabsTrigger value="nearby">Nearby</TabsTrigger>
            </TabsList>
          </div>
          { isSearching && (
             <div className="mt-4 flex justify-between items-center bg-muted p-2 rounded-lg">
                <p className="text-sm text-muted-foreground">Showing results for &quot;{searchQuery}&quot;</p>
                <Button variant="ghost" size="sm" onClick={clearSearch}>
                    <X className="w-4 h-4 mr-1"/>
                    Clear
                </Button>
            </div>
          )}
          <TabsContent value="recommend">
             {isLoading ? (
                <div className="flex items-center justify-center h-48">
                    <Loader2 className="w-8 h-8 animate-spin text-primary"/>
                </div>
            ) : showPlaceholder ? (
                <div className="flex items-center justify-center h-48">
                    <p className="text-muted-foreground">No users found.</p>
                </div>
            ) : (
                <div className="space-y-2 mt-4">
                    {displayedProfiles.map((user) => (
                        <ProfileListItem key={user.id} user={user} />
                    ))}
                </div>
            )}
          </TabsContent>
          <TabsContent value="newcomer">
             <div className="flex items-center justify-center h-48">
                <p className="text-muted-foreground">No newcomers yet.</p>
             </div>
          </TabsContent>
          <TabsContent value="nearby">
              <div className="flex items-center justify-center h-48">
                <p className="text-muted-foreground">No users nearby.</p>
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
