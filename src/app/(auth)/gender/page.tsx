
'use client';

import { useState } from 'react';
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { createUserInFirestore } from '@/lib/data';
import type { User } from '@/types';

export default function GenderSelectionPage() {
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleContinue = async () => {
    if (selectedGender) {
        setIsLoading(true);
        const firebaseUser = auth.currentUser;

        if (!firebaseUser) {
            toast({
                variant: 'destructive',
                title: 'Not Authenticated',
                description: 'You must be logged in to select a gender.',
            });
            router.push('/login');
            return;
        }

        try {
            const newUser: Partial<User> = {
                id: firebaseUser.uid,
                gender: selectedGender as 'male' | 'female' | 'other',
                name: `User-${firebaseUser.uid.substring(0, 5)}`,
            };

            await createUserInFirestore(newUser as User);

            toast({
                title: 'Welcome!',
                description: 'Your profile has been created.',
            });
            router.push('/discover');

        } catch (error) {
            console.error('Error creating user profile:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not create your profile. Please try again.',
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
            variant={selectedGender === 'woman' ? 'default' : 'outline'}
            className={cn('w-full font-bold py-6 text-base justify-between', selectedGender === 'woman' ? 'bg-primary text-primary-foreground' : 'border-primary/30 hover:bg-primary/5')}
            onClick={() => setSelectedGender('woman')}
          >
            Woman
            {selectedGender === 'woman' && <Check className="h-5 w-5" />}
          </Button>
          <Button
            variant={selectedGender === 'man' ? 'default' : 'outline'}
            className={cn('w-full font-bold py-6 text-base justify-between', selectedGender === 'man' ? 'bg-primary text-primary-foreground' : 'border-primary/30 hover:bg-primary/5')}
            onClick={() => setSelectedGender('man')}
          >
            Man
            {selectedGender === 'man' && <Check className="h-5 w-5" />}
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
