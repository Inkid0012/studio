

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FizuLogo } from '@/components/icons/fizu-logo';
import { cn } from '@/lib/utils';
import { Check, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { createUserInFirestore, getCurrentUser, setCurrentUser } from '@/lib/data';
import type { User } from '@/types';
import { AlertDialogTrigger } from '@radix-ui/react-alert-dialog';

export default function GenderSelectionPage() {
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUserFromState] = useState<User | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || !user.id) {
       toast({
        variant: 'destructive',
        title: 'Not Authenticated',
        description: 'You must be logged in to select a gender.',
      });
      router.push('/login');
    } else {
        setCurrentUserFromState(user);
    }
  }, [router, toast]);


  const handleContinue = async () => {
    if (selectedGender && currentUser) {
        setIsLoading(true);
        
        try {
            const updatedUser: User = {
                ...currentUser,
                gender: selectedGender as 'male' | 'female',
            };

            await createUserInFirestore(updatedUser);
            setCurrentUser(updatedUser); // Update local state as well

            toast({
                title: 'Welcome!',
                description: 'Your profile has been created.',
            });
            router.push('/discover');

        } catch (error) {
            console.error('Error updating user profile:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not update your profile. Please try again.',
            });
            setIsLoading(false);
        }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <FizuLogo className="mx-auto mb-4 text-5xl" />
          <h2 className="text-2xl font-bold font-headline">What's your gender?</h2>
          <p className="mt-2 text-center text-muted-foreground font-body">
            This helps us find you better matches.
          </p>
        </div>

        <div className="space-y-4">
          <Button
            variant={selectedGender === 'female' ? 'default' : 'outline'}
            className={cn('w-full font-bold py-6 text-base justify-between', selectedGender === 'female' ? 'bg-primary text-primary-foreground' : 'border-primary/30 hover:bg-primary/5')}
            onClick={() => setSelectedGender('female')}
          >
            Woman
            {selectedGender === 'female' && <Check className="h-5 w-5" />}
          </Button>
          <Button
            variant={selectedGender === 'male' ? 'default' : 'outline'}
            className={cn('w-full font-bold py-6 text-base justify-between', selectedGender === 'male' ? 'bg-primary text-primary-foreground' : 'border-primary/30 hover:bg-primary/5')}
            onClick={() => setSelectedGender('male')}
          >
            Man
            {selectedGender === 'male' && <Check className="h-5 w-5" />}
          </Button>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              disabled={!selectedGender || isLoading}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold py-6 text-base"
            >
              Continue
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Your Gender</AlertDialogTitle>
              <AlertDialogDescription>
                Please note that you will not be able to change your gender after this step. Are you sure you want to proceed?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleContinue} disabled={isLoading} className="bg-primary hover:bg-primary/90">
                 {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
