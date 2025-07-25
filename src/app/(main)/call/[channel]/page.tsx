
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
import { Mic, MicOff, Phone, PhoneOff, Loader2 } from 'lucide-react';
import { MainHeader } from '@/components/layout/main-header';
import { useToast } from '@/hooks/use-toast';
import { getUserById, getCurrentUser, CHARGE_COSTS, addTransaction, createUserInFirestore, setCurrentUser } from '@/lib/data';
import type { User } from '@/types';
import { cn } from '@/lib/utils';

const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || '5f5749cfcb054a82b4c779444f675284';
let client: IAgoraRTCClient | null = null;
let localAudioTrackRef: IMicrophoneAudioTrack | null = null;

async function joinAgoraCall(channelName: string, userId: string): Promise<void> {
  if (!appId) {
      throw new Error("Agora App ID is missing.");
  }
  const role = "publisher";

  // Get token from your Render backend
  const response = await fetch(`https://fizu-agora-token-server.onrender.com/rtc/${channelName}/${role}/${userId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch token: ${response.statusText}`);
  }

  const data = await response.json();
  const token = data.token;
  
  if (!token) {
    throw new Error("Agora token is missing. Call cannot be initiated.");
  }

  client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
  await client.join(appId, channelName, token, userId);
  
  // Voice only: create microphone audio track
  const micTrack = await AgoraRTC.createMicrophoneAudioTrack();
  localAudioTrackRef = micTrack;
  await client.publish([micTrack]);

  console.log("🎤 Joined Agora voice call successfully!");
}

async function endAgoraCall() {
  if (localAudioTrackRef) {
    localAudioTrackRef.stop();
    localAudioTrackRef.close();
    localAudioTrackRef = null;
  }
  if (client) {
    await client.leave();
    client = null;
  }
  console.log("❌ Left voice call.");
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
  const [callStatus, setCallStatus] = useState('Idle');
  const [callDuration, setCallDuration] = useState(0);
  
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

    // Cleanup on component unmount
    return () => {
        if(callConnectedRef.current) {
            handleLeave("Component unmounted");
        }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleJoin = async () => {
      if (!currentUser || !channelName) return;
      setCallStatus('Connecting...');
      try {
          await joinAgoraCall(channelName, currentUser.id);
          setCallStatus('Connected');
          callConnectedRef.current = true;
          startTimer();

          client?.on('user-published', async (user, mediaType) => {
            await client?.subscribe(user, mediaType);
            if (mediaType === 'audio') {
              user.audioTrack?.play();
            }
          });
    
          client?.on('user-left', () => {
            handleLeave('The other user left the call.');
          });

      } catch (error) {
          console.error("Failed to join Agora call", error);
          setCallStatus('Failed');
          toast({ variant: 'destructive', title: 'Call Failed', description: 'Could not connect to the voice call.' });
      }
  }


  const handleLeave = async (reason?: string, isError = false) => {
    stopTimer();
    setCallStatus('Leaving...');
    await endAgoraCall();
    callConnectedRef.current = false;
    if(reason) {
        toast({ title: 'Call Ended', description: reason, variant: isError ? 'destructive' : 'default' });
    }
    setCallStatus('Idle');
  };
  

  const startTimer = () => {
    if(timerIntervalRef.current) return;
    
    handleCoinDeduction();

    timerIntervalRef.current = setInterval(() => {
        setCallDuration(prev => {
            const newDuration = prev + 1;
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
    setCallDuration(0);
  };

  const handleCoinDeduction = async () => {
    if(!currentUser || !otherUser) return;

    const latestUser = await getUserById(currentUser.id);
    if (!latestUser) {
        await handleLeave('Could not verify your coin balance.', true);
        return;
    }
    
    if (latestUser.gender === 'male' && latestUser.coins < CHARGE_COSTS.call) {
        await handleLeave('You have insufficient coins.', true);
        return;
    }

    if (latestUser.gender === 'male') {
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
    }
  };

  const toggleMute = async () => {
    if (localAudioTrackRef) {
      await localAudioTrackRef.setMuted(!isMuted);
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
      <MainHeader title="Voice Call" showBackButton={true} />
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
                isMuted ? 'bg-primary text-primary-foreground' : 'bg-muted',
                !callConnectedRef.current && 'opacity-50 pointer-events-none'
                )}
                disabled={!callConnectedRef.current}
            >
                {isMuted ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </Button>
            
            {!callConnectedRef.current ? (
                 <Button
                    size="lg"
                    onClick={handleJoin}
                    className="rounded-full w-20 h-20 bg-green-500 hover:bg-green-600"
                >
                    <Phone className="w-8 h-8" />
                </Button>
            ) : (
                <Button
                    size="lg"
                    onClick={() => handleLeave('Call ended by user')}
                    className="rounded-full w-20 h-20 bg-destructive hover:bg-destructive/90"
                >
                    <PhoneOff className="w-8 h-8" />
                </Button>
            )}
        </div>
      </div>
    </div>
  );
}
