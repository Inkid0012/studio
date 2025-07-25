
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import AgoraRTC, {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getUserById, getCurrentUser, CHARGE_COSTS, addTransaction, createUserInFirestore, setCurrentUser } from '@/lib/data';
import type { User } from '@/types';
import { MainHeader } from '@/components/layout/main-header';
import { Loader2 } from 'lucide-react';

let client: IAgoraRTCClient | null = null;
let localAudioTrack: IMicrophoneAudioTrack | null = null;

export default function CallPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [callState, setCallState] = useState<'idle' | 'incoming' | 'active' | 'declined'>('incoming');
  const [timer, setTimer] = useState('00:00');
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [currentUser, setCurrentUserFromState] = useState<User | null>(null);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const coinsUsedRef = useRef(0);
  const callStartTimeRef = useRef<number | null>(null);

  const channelName = params.channel as string;
  const otherUserId = searchParams.get('otherUserId');

  useEffect(() => {
    const user = getCurrentUser();
     if (!user || !otherUserId) {
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

    // Ensure we leave the call if the component is unmounted
    return () => {
        if (client) {
            endAgoraCall();
        }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const startTimerAndCoins = () => {
    callStartTimeRef.current = Date.now();
    coinsUsedRef.current = 0;

    // Initial deduction for the first minute
    handleCoinDeduction();
    
    timerIntervalRef.current = setInterval(() => {
        if (!callStartTimeRef.current) return;
        const elapsed = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
        const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const seconds = String(elapsed % 60)).padStart(2, '0');
        setTimer(`${minutes}:${seconds}`);

        // Deduct coins every minute
        if (elapsed > 0 && elapsed % 60 === 0) {
            handleCoinDeduction();
        }
    }, 1000);
  };

  const handleCoinDeduction = async () => {
    if(!currentUser || !otherUser) return;
    if (currentUser.gender !== 'male') return; // Only charge men

    const latestUser = await getUserById(currentUser.id);
    if (!latestUser || latestUser.coins < CHARGE_COSTS.call) {
        toast({ variant: 'destructive', title: 'Call Ended', description: 'You have run out of coins.' });
        endAgoraCall();
        return;
    }

    const updatedCoins = latestUser.coins - CHARGE_COSTS.call;
    const updatedUser: User = { ...latestUser, coins: updatedCoins };
    
    await createUserInFirestore(updatedUser);
    await addTransaction({
        userId: currentUser.id,
        type: 'spent',
        amount: CHARGE_COSTS.call,
        description: `Call with ${otherUser.name}`
    });
    
    coinsUsedRef.current += CHARGE_COSTS.call;
    setCurrentUser(updatedUser);
    setCurrentUserFromState(updatedUser);
  };


  const joinAgoraCall = async () => {
    if (!currentUser || !channelName) return;

    try {
        const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || '5f5749cfcb054a82b4c779444f675284';
        const role = "publisher";
        const response = await fetch(`https://fizu-agora-token-server.onrender.com/rtc/${channelName}/${role}/${currentUser.id}`);
        const data = await response.json();
        const token = data.token;
        
        if (!token) throw new Error("Token missing");

        client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        await client.join(appId, channelName, token, currentUser.id);

        localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        await client.publish([localAudioTrack]);
        
        console.log("✅ Joined voice call!");
        
        setCallState('active');
        startTimerAndCoins();

    } catch (error) {
        console.error("Agora join failed", error);
        toast({ variant: 'destructive', title: 'Call Failed', description: 'Could not connect to the call.' });
    }
  };

  const endAgoraCall = async () => {
    if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
        localAudioTrack = null;
    }
    if (client) {
        await client.leave();
        client = null;
    }

    if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
    }
    
    setCallState('idle');
    setTimer('00:00');
    
    toast({
        title: "Call Ended",
        description: `You used ${coinsUsedRef.current} coins.`,
    });
    coinsUsedRef.current = 0;
    
    // Redirect after a delay
    setTimeout(() => router.push('/discover'), 2000);
  };
  
  const handleAccept = () => {
    joinAgoraCall();
  };

  const handleDecline = () => {
    toast({ title: 'Call Declined' });
    setCallState('declined');
    router.push('/discover');
  };

  if (!otherUser || !currentUser) {
     return (
       <div className="flex items-center justify-center h-screen bg-background">
            <Loader2 className="w-8 h-8 animate-spin text-primary"/>
       </div>
    );
  }


  return (
    <div className="bg-background min-h-screen text-center flex flex-col items-center justify-center p-8">
      <MainHeader title="Voice Call" />
      {callState === 'incoming' && (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">Incoming Voice Call from {otherUser.name}</h2>
            <div className="flex justify-center gap-4">
                <Button onClick={handleAccept} className="bg-green-500 hover:bg-green-600">✅ Accept Call</Button>
                <Button onClick={handleDecline} variant="destructive">❌ Decline</Button>
            </div>
        </div>
      )}

      {callState === 'active' && (
         <div id="call-ui" className="space-y-4">
            <p className="text-xl">🟢 Call in Progress with {otherUser.name}...</p>
            <p id="timer" className="font-mono text-4xl font-bold">⏱️ {timer}</p>
            <Button onClick={endAgoraCall} variant="destructive">🔴 End Call</Button>
        </div>
      )}
    </div>
  );
}
