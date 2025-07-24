
'use client';

import { getDiscoverProfiles } from "@/lib/data";
import { MainHeader } from "@/components/layout/main-header";
import { useEffect, useState } from "react";
import { User } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle, Search, Wallet } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileListItem } from "@/components/profile-list-item";

export default function DiscoverPage() {
  const [profiles, setProfiles] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      setIsLoading(true);
      const fetchedProfiles = await getDiscoverProfiles();
      setProfiles(fetchedProfiles);
      setIsLoading(false);
    };
    fetchProfiles();
  }, []);

  const showPlaceholder = !isLoading && profiles.length === 0;

  return (
    <div>
      <MainHeader title="" showBackButton={false} />
      <div className="p-4 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-orange-400 text-white shadow-lg overflow-hidden">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <h3 className="font-bold text-lg">Voice Chat</h3>
              <div className="flex justify-end">
                <PlayCircle className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Link href="/wallet">
            <Card className="bg-yellow-400 text-white shadow-lg overflow-hidden">
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
            <Button variant="ghost" size="icon">
                <Search className="h-6 w-6"/>
            </Button>
          </div>
          <TabsContent value="recommend">
             {isLoading ? (
                <div className="flex items-center justify-center h-48">
                    <p className="text-muted-foreground">[users will appear here]</p>
                </div>
            ) : showPlaceholder ? (
                <div className="flex items-center justify-center h-48">
                    <p className="text-muted-foreground">[users will appear here]</p>
                </div>
            ) : (
                <div className="space-y-2 mt-4">
                    {profiles.map((user) => (
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
