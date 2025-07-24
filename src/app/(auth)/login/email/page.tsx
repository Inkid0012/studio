
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { getUserById, setCurrentUser, createUserInFirestore } from '@/lib/data';
import type { User } from '@/types';
import { MainHeader } from '@/components/layout/main-header';
import { FizuLogo } from '@/components/icons/fizu-logo';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
});

type FormValues = z.infer<typeof formSchema>;

export default function EmailAuthPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleSignIn = async (data: FormValues) => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const firebaseUser = userCredential.user;

      const userProfile = await getUserById(firebaseUser.uid);
      if (userProfile) {
        setCurrentUser(userProfile);
        router.push('/discover');
      } else {
        // This case should ideally not happen for a user who is signing in,
        // but as a fallback, we send them to the gender page to create a profile.
        const newUser: Partial<User> = { id: firebaseUser.uid, email: firebaseUser.email || '' };
        setCurrentUser(newUser as User);
        router.push('/gender');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description:
          error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password'
            ? 'Invalid email or password.'
            : 'An unexpected error occurred. Please try again.',
      });
      setIsLoading(false);
    }
  };

  const handleSignUp = async (data: FormValues) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const firebaseUser = userCredential.user;

      const newUser: User = {
        id: firebaseUser.uid,
        name: `User-${firebaseUser.uid.substring(0, 5)}`,
        email: firebaseUser.email || '',
        isAnonymous: false,
        // Set other default fields
        age: 0,
        dob: new Date().toISOString(),
        gender: 'other',
        bio: '',
        profilePicture: 'https://placehold.co/400x400.png',
        interests: [],
        isCertified: false,
        coins: 0,
        followers: [],
        following: [],
        visitors: 0,
      };

      await createUserInFirestore(newUser);
      setCurrentUser(newUser);

      router.push('/gender');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description:
          error.code === 'auth/email-already-in-use'
            ? 'This email is already registered.'
            : 'An unexpected error occurred. Please try again.',
      });
      setIsLoading(false);
    }
  };

  const onSubmit = (data: FormValues) => {
    if (activeTab === 'signin') {
      handleSignIn(data);
    } else {
      handleSignUp(data);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainHeader title="Continue with Email" showBackButton={true} />
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 text-center">
            <FizuLogo className="mx-auto mb-4 text-5xl" />
        
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <p className="text-muted-foreground mb-4">
                Welcome back! Sign in to your account.
              </p>
            </TabsContent>
             <TabsContent value="signup">
              <p className="text-muted-foreground mb-4">
                Create a new account to find your spark.
              </p>
            </TabsContent>
          </Tabs>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Email Address" {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Password</FormLabel>
                    <FormControl>
                      <Input placeholder="Password" {...field} type="password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold py-6 text-base">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {activeTab === 'signin' ? 'Sign In' : 'Sign Up'}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
