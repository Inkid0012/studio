"use client";

import { MainHeader } from "@/components/layout/main-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ChevronRight, Palette, BellOff, Trash2, Shield, Settings as CogIcon, Info, XCircle, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useState } from "react";

const SettingsItem = ({ label, value, onClick, valueColor, icon: Icon }: { label: string, value?: string, onClick?: () => void, valueColor?: string, icon: React.ElementType }) => (
  <button onClick={onClick} className="flex items-center w-full py-4 text-left border-b last:border-b-0">
    <Icon className="h-5 w-5 mr-4 text-muted-foreground" />
    <span className="flex-1 text-base">{label}</span>
    <div className="flex items-center gap-2 text-muted-foreground">
      {value && <span className={valueColor}>{value}</span>}
      <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
    </div>
  </button>
);


export default function SettingsPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [dndMode, setDndMode] = useState(false);

    const handleClearCache = () => {
        toast({
            title: "Cache Cleared",
            description: "Application cache has been cleared successfully.",
        });
    }

     const handleLogout = async () => {
        try {
          await signOut(auth);
          localStorage.removeItem('currentUser');
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

    return (
        <div className="flex flex-col min-h-screen">
            <MainHeader title="Settings" showBackButton={true}/>
            <div className="flex-1 p-4 space-y-4">
               <div className="bg-card rounded-lg p-2">
                    <SettingsItem label="Account" icon={User} onClick={() => router.push('/settings/account')} />
                    <SettingsItem label="Blocked List" icon={XCircle} onClick={() => router.push('/settings/blocked')} />
                    <SettingsItem label="Clear Cache" icon={Trash2} onClick={handleClearCache} />
                    <SettingsItem label="About Fizu" icon={Info} onClick={() => router.push('/settings/about')} />
               </div>

               <div className="bg-card rounded-lg p-2">
                    <div className="flex items-center w-full py-4 border-b">
                        <Palette className="h-5 w-5 mr-4 text-muted-foreground" />
                        <Label htmlFor="theme-toggle" className="flex-1 text-base">
                            Theme
                        </Label>
                        <ThemeToggle />
                    </div>
                     <div className="flex items-center w-full py-4">
                        <BellOff className="h-5 w-5 mr-4 text-muted-foreground" />
                        <Label htmlFor="dnd-mode" className="flex-1 text-base">
                            Do Not Disturb
                        </Label>
                        <Switch id="dnd-mode" checked={dndMode} onCheckedChange={setDndMode} />
                    </div>
               </div>
            </div>
            <div className="p-4 mt-auto">
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full text-base py-6 bg-accent/20 text-accent-foreground border-accent/30 hover:bg-accent/30">
                            Sign out
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You can always log back in. Your data will be saved.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-primary hover:bg-primary/90" onClick={handleLogout}>Sign out</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}
