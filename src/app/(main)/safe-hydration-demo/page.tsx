
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getSimpleResponse } from '@/ai/flows/hydration-demo-flow';
import { MainHeader } from '@/components/layout/main-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, User, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SafeHydrationDemoPage() {
  // State for Firebase Auth user. Initialized to null.
  // We use a specific `isAuthLoading` state to know when we can render auth-dependent UI.
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // State for AI interaction
  const [prompt, setPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const { toast } = useToast();

  // The key to avoiding hydration errors is to use `useEffect` for any code that
  // should only run on the client. Firebase Auth relies on browser APIs.
  useEffect(() => {
    // onAuthStateChanged returns an unsubscribe function, which we'll use for cleanup.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false); // Set loading to false once we have a user or know there isn't one.
    });

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, []); // The empty dependency array ensures this effect runs only once on mount.


  const handleGetAiResponse = async () => {
    if (!prompt) {
      toast({ variant: 'destructive', title: 'Prompt is empty', description: 'Please enter some text.' });
      return;
    }
    setIsAiLoading(true);
    setAiResponse('');
    try {
      const result = await getSimpleResponse({ prompt });
      setAiResponse(result.response);
    } catch (error) {
      console.error('AI call failed:', error);
      toast({ variant: 'destructive', title: 'AI Error', description: 'Could not get a response.' });
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div>
      <MainHeader title="Hydration Demo" />
      <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User /> Firebase Auth Status</CardTitle>
            <CardDescription>
              This section demonstrates how to safely access Firebase Auth on the client without causing hydration errors.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isAuthLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="animate-spin h-5 w-5" />
                <span>Checking authentication status...</span>
              </div>
            ) : user ? (
              <div>
                <p className="font-semibold text-green-600">User is signed in.</p>
                <p className="text-sm text-muted-foreground">User ID: {user.uid}</p>
              </div>
            ) : (
              <p className="font-semibold text-red-600">User is not signed in.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles /> Gemini AI Interaction</CardTitle>
            <CardDescription>
              Enter a prompt to get a response from Gemini. This interaction is handled entirely on the client.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask a question..."
              disabled={isAiLoading}
            />
            {aiResponse && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-semibold">AI Response:</p>
                <p>{aiResponse}</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleGetAiResponse} disabled={isAiLoading}>
              {isAiLoading && <Loader2 className="mr-2 animate-spin h-5 w-5" />}
              Get Response
            </Button>
          </CardFooter>
        </Card>

      </div>
    </div>
  );
}
