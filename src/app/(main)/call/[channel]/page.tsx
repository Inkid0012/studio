
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import type {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getUserById, getCurrentUser, CHARGE_COSTS, addTransaction, createUserInFirestore, setCurrentUser, onCallUpdate, updateCallStatus } from '@/lib/data';
import type { User, Call } from '@/types';
import { Loader2, Phone, PhoneOff, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

let client: IAgoraRTCClient | null = null;
let localAudioTrack: IMicrophoneAudioTrack | null = null;

type CallComponentState = 'idle' | 'initializing' | 'ringing' | 'in_call' | 'ending' | 'ended' | 'error';


export default function CallPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [call, setCall] = useState<Call | null>(null);
  const [componentState, setComponentState] = useState<CallComponentState>('initializing');
  const [timer, setTimer] = useState('00:00');
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [currentUser, setCurrentUserFromState] = useState<User | null>(null);
  const [showRechargeDialog, setShowRechargeDialog] = useState(false);
  const [endReason, setEndReason] = useState('Call Ended');
  
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const coinsUsedRef = useRef(0);
  const callStartTimeRef = useRef<number | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  
  const callId = params.channel as string;
  const otherUserId = searchParams.get('otherUserId');
  
  const isMounted = useRef(true);

  // --- Core Cleanup Function ---
  const endCall = async (reason: string, showToast = true) => {
    if (componentState === 'ending' || componentState === 'ended') return;
    setComponentState('ending');
    setEndReason(reason);

    stopRingtone();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;
    
    if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
        localAudioTrack = null;
    }
    
    if (client && client.connectionState !== 'DISCONNECTED') {
        try {
            await client.leave();
        } catch (e) {
            console.error("Error leaving Agora channel", e);
        }
    }
    client = null;
    
    if (call && call.status !== 'ended' && call.status !== 'rejected' && call.status !== 'timeout') {
       await updateCallStatus(callId, 'ended');
    }
    
    if (showToast) {
        toast({
            title: reason,
            description: coinsUsedRef.current > 0 ? `You used ${coinsUsedRef.current} coins.` : '',
        });
    }
    
    setTimeout(() => {
        if (isMounted.current) {
            setComponentState('ended');
            if (router && window.location.pathname.includes('/call/')) {
                router.push('/discover');
            }
        }
    }, 1500);
  };
  
  // --- Component Mount and Unmount ---
  useEffect(() => {
    isMounted.current = true;
    const user = getCurrentUser();
    if (!user || !otherUserId) {
        toast({ variant: 'destructive', title: 'Error', description: 'Invalid call session.' });
        router.push('/discover');
        return;
    }
    setCurrentUserFromState(user);

    const fetchOtherUser = async () => {
        const otherUserProfile = await getUserById(otherUserId);
        if (otherUserProfile) {
            setOtherUser(otherUserProfile);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not find user to call.' });
            router.push('/chat');
        }
    }
    fetchOtherUser();
    
    // Call updates listener
    const unsubscribe = onCallUpdate(callId, (updatedCall) => {
        if (updatedCall) {
            setCall(updatedCall);
        } else {
            if (isMounted.current) {
                endCall('Call ended unexpectedly.', false);
            }
        }
    });

    return () => {
        isMounted.current = false;
        unsubscribe();
        if (componentState !== 'ended') {
            endCall('Call disconnected', false);
        }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callId, otherUserId, router, toast]);

  const joinAgoraCall = async () => {
    if (componentState !== 'ringing' || !currentUser) return;
    
    try {
        const AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
        const appId = '03afb548b89d4435b0d0a5b28a964a32'; // Verified Agora App ID
        client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

        client.on('user-published', async (user, mediaType) => {
            await client?.subscribe(user, mediaType);
            if (mediaType === 'audio') {
                user.audioTrack?.play();
            }
        });

        client.on('user-left', () => {
            endCall('The other user left the call.');
        });
        
        await client.join(appId, callId, null, currentUser.id);

        localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        await client.publish([localAudioTrack]);
        
        setComponentState('in_call');
        startTimerAndCoins();

    } catch (error) {
        console.error("Agora join failed", error);
        toast({ variant: 'destructive', title: 'Call Failed', description: 'Could not connect to the call.' });
        updateCallStatus(callId, 'ended');
    }
  };
  
  // --- Call State Machine ---
  useEffect(() => {
    if (!call || !currentUser || componentState === 'ending' || componentState === 'ended') return;
    
    switch (call.status) {
        case 'ringing':
            if (componentState === 'initializing') {
                setComponentState('ringing');
            }
            break;
        case 'accepted':
            stopRingtone();
            if (componentState === 'ringing') {
                joinAgoraCall();
            }
            break;
        case 'rejected':
            endCall('Call Rejected');
            break;
        case 'ended':
            endCall('Call Ended');
            break;
        case 'timeout':
            endCall('Call Timed Out');
            break;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call, currentUser]);
  
  // Effect to handle ringtone playback based on component state
  useEffect(() => {
    if (componentState === 'ringing' && call?.to === currentUser?.id) {
      playRingtone();
    } else {
      stopRingtone();
    }
  }, [componentState, call, currentUser]);


  const playRingtone = () => {
      if(ringtoneRef.current) {
          ringtoneRef.current.loop = true;
          const playPromise = ringtoneRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn("Ringtone autoplay was blocked by the browser.", error);
            });
          }
      }
  }

  const stopRingtone = () => {
      if(ringtoneRef.current && !ringtoneRef.current.paused) {
          ringtoneRef.current.pause();
          ringtoneRef.current.currentTime = 0;
      }
  }

  const startTimerAndCoins = () => {
    if (timerIntervalRef.current) return;

    callStartTimeRef.current = Date.now();
    coinsUsedRef.current = 0;

    if (currentUser?.gender === 'male') {
        handleCoinDeduction();
    }
    
    timerIntervalRef.current = setInterval(() => {
        if (!callStartTimeRef.current) return;
        const elapsed = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
        const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const seconds = String(elapsed % 60)).padStart(2, '0');
        if (isMounted.current) {
            setTimer(`${minutes}:${seconds}`);
        }

        if (currentUser?.gender === 'male' && elapsed > 0 && elapsed % 60 === 0) {
            handleCoinDeduction();
        }
    }, 1000);
  };

  const handleCoinDeduction = async () => {
    if(!currentUser || !otherUser) return;
    
    const latestUser = await getUserById(currentUser.id);
    if (!latestUser || latestUser.coins < CHARGE_COSTS.call) {
        updateCallStatus(callId, 'ended');
        toast({ variant: 'destructive', title: 'Call Ended', description: 'You have run out of coins.' });
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
    if (isMounted.current) {
        setCurrentUserFromState(updatedUser);
    }
  };

  const handleAccept = () => {
    if (componentState !== 'ringing') return;
    updateCallStatus(callId, 'accepted');
  };

  const handleDecline = () => {
    if (componentState !== 'ringing' && componentState !== 'in_call') return;
    updateCallStatus(callId, 'rejected');
  };

  const handleEndCallButton = () => {
    updateCallStatus(callId, 'ended');
  }
  
  if (showRechargeDialog) {
    return (
        <AlertDialog open={true} onOpenChange={() => router.back()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Insufficient Coins</AlertDialogTitle>
                    <AlertDialogDescription>
                        You need at least {CHARGE_COSTS.call} coins to make a call. Please recharge your balance.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => router.back()}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => router.push('/wallet')}>Recharge</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
  }

  if (componentState === 'initializing' || !otherUser || !currentUser || !call) {
     return (
       <div className="flex items-center justify-center h-screen bg-background">
            <Loader2 className="w-8 h-8 animate-spin text-primary"/>
       </div>
    );
  }

  const CallInterface = ({ children, title }: {children: React.ReactNode, title?: string}) => (
     <div className="bg-background min-h-screen text-center flex flex-col items-center justify-between p-8 relative">
        <audio
          ref={ringtoneRef}
          src="https://www.soundjay.com/phone/sounds/telephone-ring-02.mp3"
          loop
          preload="auto"
        />
      <div className="flex flex-col items-center gap-4 mt-24">
        <Avatar className="w-32 h-32 border-4 border-primary">
            <AvatarImage src={otherUser.profilePicture} alt={otherUser.name} />
            <AvatarFallback className="text-4xl">{otherUser.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <h2 className="text-3xl font-bold font-headline">{otherUser.name}</h2>
        {title && <p className="text-muted-foreground animate-pulse">{title}</p>}
      </div>
      
      {children}
    </div>
  );

  if (componentState === 'ringing' && call.to === currentUser.id) {
    return (
        <CallInterface title="Incoming Call...">
            <div className="w-full max-w-xs">
                <div className="flex justify-around items-center">
                    <Button onClick={handleDecline} variant="destructive" size="icon" className="w-20 h-20 rounded-full">
                        <PhoneOff className="w-8 h-8" />
                    </Button>
                    <Button onClick={handleAccept} className="bg-green-500 hover:bg-green-600 w-20 h-20 rounded-full" size="icon">
                        <Phone className="w-8 h-8" />
                    </Button>
                </div>
            </div>
        </CallInterface>
    )
  }
  
  if (componentState === 'ringing' && call.from === currentUser.id) {
      return (
        <CallInterface title="Ringing...">
            <div className="w-full max-w-xs">
                <div className="flex justify-around items-center">
                    <Button onClick={handleDecline} variant="destructive" size="icon" className="w-20 h-20 rounded-full">
                        <PhoneOff className="w-8 h-8" />
                    </Button>
                </div>
            </div>
        </CallInterface>
      )
  }

  if (componentState === 'in_call') {
      return (
         <CallInterface>
            <div className="w-full max-w-xs">
                <p id="timer" className="font-mono text-2xl font-bold mb-8 text-green-500">{timer}</p>
                 <div className="flex justify-around items-center">
                    <Button onClick={handleEndCallButton} variant="destructive" size="icon" className="w-20 h-20 rounded-full">
                        <PhoneOff className="w-8 h-8" />
                    </Button>
                </div>
            </div>
        </CallInterface>
      )
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-lg font-semibold">
      <p>{endReason}</p>
    </div>
  );
}
