
'use client';

import { MainHeader } from "@/components/layout/main-header";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { deleteUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { deleteDoc, doc } from "firebase/firestore";

export default function AccountSettingsPage() {
    const [confirmationText, setConfirmationText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        const user = auth.currentUser;

        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'No user is currently signed in.' });
            setIsDeleting(false);
            return;
        }

        try {
            // Delete user data from Firestore
            await deleteDoc(doc(db, "users", user.uid));

            // Delete user from Firebase Auth
            await deleteUser(user);
            
            localStorage.removeItem('currentUser');

            toast({
                title: 'Account Deleted',
                description: 'Your account has been permanently deleted.',
            });

            router.push('/login');

        } catch (error: any) {
            console.error("Error deleting account:", error);
            toast({
                variant: 'destructive',
                title: 'Deletion Failed',
                description: 'An error occurred while deleting your account. You may need to sign in again to complete this action.',
            });
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <MainHeader title="Account" showBackButton={true} />
            <div className="flex-1 p-4">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full text-base py-6">
                            <Trash2 className="mr-2 h-5 w-5"/>
                            Delete Account
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your account and remove all your data from our servers. Please type <strong className="text-foreground">delete</strong> to confirm.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <Input 
                            value={confirmationText}
                            onChange={(e) => setConfirmationText(e.target.value)}
                            placeholder='Type "delete" to confirm'
                            className="bg-muted"
                        />
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                                className="bg-destructive hover:bg-destructive/90"
                                disabled={confirmationText.toLowerCase() !== 'delete' || isDeleting}
                                onClick={handleDeleteAccount}
                            >
                                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Delete My Account
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}
