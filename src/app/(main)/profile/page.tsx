import Image from "next/image";
import Link from "next/link";
import { currentUser } from "@/lib/data";
import { MainHeader } from "@/components/layout/main-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Bot, Pen, Settings, Coins } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProfilePage() {
  const user = currentUser;

  return (
    <div>
      <MainHeader title="Profile" showBackButton={false}>
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <Settings className="h-6 w-6 text-muted-foreground hover:text-accent" />
          </Button>
        </Link>
      </MainHeader>
      <div className="p-4 space-y-6">
        <Card className="shadow-lg">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <Avatar className="w-32 h-32 border-4 border-accent mb-4">
              <AvatarImage src={user.profilePicture} alt={user.name} data-ai-hint="portrait person" />
              <AvatarFallback className="text-4xl">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex items-center">
                <h2 className="text-3xl font-bold font-headline">{user.name}, {user.age}</h2>
                {user.isCertified && <CheckCircle className="ml-2 h-6 w-6 text-accent fill-primary" />}
            </div>
            <div className="flex items-center text-muted-foreground mt-2">
                <Coins className="h-5 w-5 mr-2 text-accent"/>
                <span>{user.coins} Coins</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button asChild variant="outline" className="font-bold py-6 text-base border-primary/30 hover:bg-primary/5">
                <Link href="/profile/edit">
                    <Pen className="mr-2 h-5 w-5 text-accent"/>
                    Edit Profile
                </Link>
            </Button>
             <Button asChild variant="outline" className="font-bold py-6 text-base border-primary/30 hover:bg-primary/5">
                <Link href="/profile/improve">
                    <Bot className="mr-2 h-5 w-5 text-accent"/>
                    AI Profile Coach
                </Link>
            </Button>
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl">About Me</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground font-body">{user.bio}</p>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Interests</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
                {user.interests.map(interest => (
                    <Badge key={interest} variant="secondary" className="text-base py-1 px-3 bg-accent/20 text-accent-foreground border-accent/30">{interest}</Badge>
                ))}
            </CardContent>
        </Card>

      </div>
    </div>
  );
}
