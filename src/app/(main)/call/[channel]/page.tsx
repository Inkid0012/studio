
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, PhoneOff, Loader2 } from 'lucide-react';
import { MainHeader } from '@/components/layout/main-header';
import { useToast } from '@/hooks/use-toast';
import { getUserById, getCurrentUser, CHARGE_COSTS, addTransaction, createUserInFirestore, setCurrentUser } from '@/lib/data';
import type { User } from '@/types';
import { cn } from '@/lib/utils';

const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || '5f5749cfcb054a82b4c779444f675284';

/**
 * Fetches a token from an Agora token server and joins a voice call.
 * @param client The Agora RTC client instance.
 * @param channelName The name of the channel to join.
 * @param userId The ID of the user joining the call.
 * @returns The local microphone audio track.
 */
async function joinAgoraCall(client: IAgoraRTCClient, channelName: string, userId: string): Promise<IMicrophoneAudioTrack> {
  // IMPORTANT: Replace this URL with your actual Agora token server endpoint.
  const tokenServerUrl = `https://your-token-server.com/agora-token?channelName=${channelName}&userId=${userId}`;
  
  let token: string | null = null;
  
  try {
    const response = await fetch(tokenServerUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch token: ${response.statusText}`);
    }
    const data = await response.json();
    token = data.token;
  } catch (error) {
    console.error('Could not fetch Agora token.', error);
    // Fallback to a null token for development if the server is not available.
    // In production, you should handle this error more gracefully.
    token = process.env.NEXT_PUBLIC_AGORA_TEMP_TOKEN || null;
  }
  
  if (!token) {
    throw new Error("Agora token is missing. Call cannot be initiated.");
  }
  
  await client.join(appId, channelName, token, userId);
  const micTrack = await AgoraRTC.createMicrophoneAudioTrack();
  await client.publish([micTrack]);
  
  return micTrack;
}


export default function CallPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const channelName = params.channel as string;
  const otherUserId = searchParams.get('otherUserId');

  const [currentUser, setCurrentUserFromState] = useState<User | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [callStatus, setCallStatus] = useState('Connecting...');
  const [callDuration, setCallDuration] = useState(0);
  
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const callConnectedRef = useRef(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || !appId || !otherUserId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Invalid call session.' });
      router.push('/discover');
      return;
    }
    setCurrentUserFromState(user);

    const fetchOtherUser = async () => {
        const userProfile = await getUserById(otherUserId);
        if (userProfile) {
            setOtherUser(userProfile);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not find user to call.' });
            router.push('/chat');
        }
    }
    fetchOtherUser();

  }, [router, toast, otherUserId]);

  useEffect(() => {
    if (!currentUser || !otherUser) return;
    
    const initAgora = async () => {
      clientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

      clientRef.current.on('user-published', async (user, mediaType) => {
        await clientRef.current?.subscribe(user, mediaType);
        if (mediaType === 'audio') {
          user.audioTrack?.play();
          if (!callConnectedRef.current) {
            setCallStatus('Connected');
            startTimer();
            callConnectedRef.current = true;
          }
        }
      });

      clientRef.current.on('user-unpublished', () => {
        setCallStatus('User left');
        handleLeave('The other user left the call.');
      });
      
       clientRef.current.on('user-left', () => {
        setCallStatus('User has left the call');
        handleLeave('The other user has left the call.');
      });

      try {
        setCallStatus('Ringing...');
        const micTrack = await joinAgoraCall(clientRef.current, channelName, currentUser.id);
        localAudioTrackRef.current = micTrack;
      } catch (error) {
        console.error('Agora initialization failed:', error);
        setCallStatus('Failed to connect');
        toast({
          variant: 'destructive',
          title: 'Call Failed',
          description: 'Could not connect to the call service.',
        });
      }
    };

    initAgora();

    return () => {
      stopTimer();
      localAudioTrackRef.current?.close();
      clientRef.current?.leave();
      clientRef.current = null;
      callConnectedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, otherUser, channelName, toast]);

  const startTimer = () => {
    if(timerIntervalRef.current) return;
    
    // Initial deduction for the first minute
    handleCoinDeduction();

    timerIntervalRef.current = setInterval(() => {
        setCallDuration(prev => {
            const newDuration = prev + 1;
            // Deduct coins at the start of each new minute (e.g., at 60s, 120s, etc.)
            if (newDuration > 0 && newDuration % 60 === 0) {
                handleCoinDeduction();
            }
            return newDuration;
        });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
    }
  };

  const handleCoinDeduction = async () => {
    if(!currentUser || !otherUser) return;

    // Fetch the latest user data to ensure coin balance is accurate
    const latestUser = await getUserById(currentUser.id);
    if (!latestUser) {
        handleLeave('Could not verify your coin balance.', true);
        return;
    }
    
    if (latestUser.coins < CHARGE_COSTS.call) {
        handleLeave('You have insufficient coins.', true);
        return;
    }

    const updatedCoins = (latestUser.coins || 0) - CHARGE_COSTS.call;
    const updatedUser = { ...latestUser, coins: updatedCoins };
    
    await createUserInFirestore(updatedUser);
    await addTransaction({
        userId: currentUser.id,
        type: 'spent',
        amount: CHARGE_COSTS.call,
        description: `Call with ${otherUser.name}`
    });
    
    setCurrentUser(updatedUser);
    setCurrentUserFromState(updatedUser);
  };

  const handleLeave = async (reason?: string, isError = false) => {
    stopTimer();
    setCallStatus('Leaving...');
    localAudioTrackRef.current?.close();
    await clientRef.current?.leave();
    callConnectedRef.current = false;
    if(reason) {
        toast({ title: 'Call Ended', description: reason, variant: isError ? 'destructive' : 'default' });
    }
    router.back();
  };

  const toggleMute = async () => {
    if (localAudioTrackRef.current) {
      await localAudioTrackRef.current.setMuted(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  if (!otherUser || !currentUser) {
    return (
       <div className="flex items-center justify-center h-screen bg-background">
            <Loader2 className="w-8 h-8 animate-spin text-primary"/>
       </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <MainHeader title="Voice Call" />
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="w-40 h-40 border-4 border-accent">
            <AvatarImage src={otherUser.profilePicture} alt={otherUser.name} data-ai-hint="portrait person" />
            <AvatarFallback className="text-5xl">{otherUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <h2 className="text-3xl font-bold">{otherUser.name}</h2>
          <p className="text-muted-foreground text-lg">{callStatus}</p>
          {callStatus === 'Connected' && (
             <p className="text-muted-foreground text-xl font-mono">{formatDuration(callDuration)}</p>
          )}
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 p-8 bg-background/80 backdrop-blur-sm border-t">
        <div className="flex justify-center items-center gap-8">
          <Button
            size="lg"
            variant="outline"
            onClick={toggleMute}
            className={cn(
              'rounded-full w-20 h-20',
              isMuted ? 'bg-primary text-primary-foreground' : 'bg-muted'
            )}
          >
            {isMuted ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </Button>
          <Button
            size="lg"
            onClick={() => handleLeave()}
            className="rounded-full w-20 h-20 bg-destructive hover:bg-destructive/90"
          >
            <PhoneOff className="w-8 h-8" />
          </Button>
        </div>
      </div>
    </div>
  );
}
