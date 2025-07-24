
'use client';

import Link from "next/link";
import { Facebook, Mail, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FizuLogo } from "@/components/icons/fizu-logo";
import { auth } from "@/lib/firebase";
import { signInAnonymously } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getUserById, setCurrentUser, createUserInFirestore } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import type { User as AppUser } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAnonymousLogin = async () => {
    setIsLoading(true);
    try {
      const userCredential = await signInAnonymously(auth);
      const firebaseUser = userCredential.user;

      // Check if user exists in Firestore
      let userProfile = await getUserById(firebaseUser.uid);

      if (userProfile) {
        setCurrentUser(userProfile);
        router.push('/discover');
      } else {
        // Create a new user profile in Firestore
        const newUser: AppUser = {
          id: firebaseUser.uid,
          name: `User-${firebaseUser.uid.substring(0, 5)}`,
          email: '', // Anonymous users don't have an email
          isAnonymous: true,
          // Set other default fields
          age: 0,
          dob: new Date().toISOString(),
          gender: 'other',
          bio: '',
          profilePicture: 'https://placehold.co/400x400.png',
          interests: [],
          isCertified: false,
          coins: 0,
          friends: 0,
          following: 0,
          followers: 0,
          visitors: 0,
        };
        await createUserInFirestore(newUser);
        setCurrentUser(newUser);
        router.push('/gender');
      }
    } catch (error) {
      console.error("Anonymous login failed:", error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Could not log in anonymously. Please try again.",
      });
      setIsLoading(false);
    }
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
            <FizuLogo className="mx-auto mb-4 text-5xl" />
          <p className="mt-2 text-center text-muted-foreground font-body">
            Find your spark.
          </p>
        </div>
        <div className="space-y-4">
          <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6 text-base" >
            <Link href="/login/email">
              <Mail className="mr-2 h-5 w-5" />
              Continue with Email
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full font-bold py-6 text-base border-primary/30 hover:bg-primary/5">
            <Link href="#">
              <Facebook className="mr-2 h-5 w-5 text-blue-600" />
              Continue with Facebook
            </Link>
          </Button>
          <Button variant="ghost" onClick={handleAnonymousLogin} disabled={isLoading} className="w-full text-muted-foreground hover:text-primary">
            {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
                <User className="mr-2 h-5 w-5" />
            )}
            Continue Anonymously
          </Button>
        </div>
        <p className="px-8 text-center text-sm text-muted-foreground font-body">
          By clicking continue, you agree to our{" "}
          <Link
            href="/terms"
            className="underline underline-offset-4 hover:text-primary"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-4 hover:text-primary"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
