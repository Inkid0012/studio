
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import AgoraRTC, {
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

export default function CallPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [call, setCall] = useState<Call | null>(null);
  const [timer, setTimer] = useState('00:00');
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [currentUser, setCurrentUserFromState] = useState<User | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const coinsUsedRef = useRef(0);
  const callStartTimeRef = useRef<number | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement>(null);
  const [showRechargeDialog, setShowRechargeDialog] = useState(false);

  const callId = params.channel as string;
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
        const otherUserProfile = await getUserById(otherUserId);
        if (otherUserProfile) {
            setOtherUser(otherUserProfile);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not find user to call.' });
            router.push('/chat');
        }
    }
    fetchOtherUser();

    // Listen for call status updates
    const unsubscribe = onCallUpdate(callId, (updatedCall) => {
        if (updatedCall) {
            setCall(updatedCall);
        } else {
            // Call document deleted or not found
            endCall(false, 'Call ended unexpectedly.');
        }
    });

    return () => {
        unsubscribe();
        endCall(false); // Cleanup on unmount
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callId, otherUserId, router, toast]);

  useEffect(() => {
    if (!call || !currentUser) return;
    
    const isOutgoing = call.from === currentUser?.id;

    // Handle state transitions based on call status
    switch (call.status) {
        case 'ringing':
            if (!isJoined) {
                playRingtone();
                if (!isOutgoing) {
                    // Timeout for incoming call
                     if (!timeoutRef.current) {
                        timeoutRef.current = setTimeout(() => {
                           updateCallStatus(callId, 'timeout');
                        }, 60000); 
                    }
                }
            }
            break;
        case 'accepted':
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            stopRingtone();
            if (!isJoined) joinAgoraCall();
            break;
        case 'rejected':
        case 'ended':
        case 'timeout':
            let reason = 'Call ended';
            if (call.status === 'rejected') reason = 'Call rejected';
            if (call.status === 'timeout') reason = 'Call timed out';
            endCall(true, reason);
            break;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call, currentUser]);


  const playRingtone = async () => {
      if(ringtoneRef.current) {
          try {
              ringtoneRef.current.loop = true;
              await ringtoneRef.current.play();
          } catch (error) {
              console.error("Ringtone autoplay failed:", error);
          }
      }
  }

  const stopRingtone = () => {
      if(ringtoneRef.current) {
          ringtoneRef.current.pause();
          ringtoneRef.current.currentTime = 0;
      }
  }

  
  const startTimerAndCoins = () => {
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
        setTimer(`${minutes}:${seconds}`);

        if (currentUser?.gender === 'male' && elapsed > 0 && elapsed % 60 === 0) {
            handleCoinDeduction();
        }
    }, 1000);
  };

  const handleCoinDeduction = async () => {
    if(!currentUser || !otherUser) return;
    
    const latestUser = await getUserById(currentUser.id);
    if (!latestUser || latestUser.coins < CHARGE_COSTS.call) {
        toast({ variant: 'destructive', title: 'Call Ended', description: 'You have run out of coins.' });
        updateCallStatus(callId, 'ended');
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
    if (!currentUser || isJoined) return;

    try {
        const appId = 'f25a74e5b9f7431e84a227845e69e3ed';
        const token = null;

        client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        setIsJoined(true);

        client.on('user-published', async (user, mediaType) => {
            await client?.subscribe(user, mediaType);
            if (mediaType === 'audio') {
                user.audioTrack?.play();
            }
        });

        client.on('user-left', () => {
            updateCallStatus(callId, 'ended');
        });
        
        await client.join(appId, callId, token, currentUser.id);

        localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        await client.publish([localAudioTrack]);
        
        startTimerAndCoins();

    } catch (error) {
        console.error("Agora join failed", error);
        toast({ variant: 'destructive', title: 'Call Failed', description: 'Could not connect to the call.' });
        updateCallStatus(callId, 'ended');
    }
  };

  const endCall = async (showToast = true, reason?: string) => {
    stopRingtone();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
        localAudioTrack = null;
    }
    if (client) {
        try {
            await client.leave();
        } catch (e) {
            console.error("Error leaving agora channel", e);
        }
        client = null;
    }
    
    setIsJoined(false);

    if (call?.status !== 'ended' && call?.status !== 'rejected' && call?.status !== 'timeout') {
       await updateCallStatus(callId, 'ended');
    }
    
    setTimer('00:00');
    
    if (showToast) {
        toast({
            title: reason || "Call Ended",
            description: coinsUsedRef.current > 0 ? `You used ${coinsUsedRef.current} coins.` : '',
        });
    }
    coinsUsedRef.current = 0;
    
    setTimeout(() => {
        if (router && window.location.pathname.includes('/call/')) {
            router.push('/discover');
        }
    }, 1500);
  };
  
  const handleAccept = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    updateCallStatus(callId, 'accepted');
  };

  const handleDecline = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    updateCallStatus(callId, 'rejected');
  };
  
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


  if (!otherUser || !currentUser || !call) {
     return (
       <div className="flex items-center justify-center h-screen bg-background">
            <Loader2 className="w-8 h-8 animate-spin text-primary"/>
       </div>
    );
  }

  const CallInterface = ({ children, showCloseButton = false, title }: {children: React.ReactNode, showCloseButton?: boolean, title?: string}) => (
     <div className="bg-background min-h-screen text-center flex flex-col items-center justify-between p-8 relative">
       {showCloseButton && (
            <div className="absolute top-6 right-6">
                <Button onClick={handleDecline} variant="ghost" size="icon" className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white">
                    <X className="w-8 h-8" />
                </Button>
            </div>
       )}
        <audio
          ref={ringtoneRef}
          src="https://www.soundjay.com/phone/sounds/telephone-ring-02.mp3"
          loop
          muted
          onCanPlay={(e) => e.currentTarget.play().catch(console.error)}
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


  if (call.status === 'ringing' && call.to === currentUser.id) {
    return (
        <CallInterface showCloseButton={true} title="Incoming Call...">
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
  
  if (call.status === 'ringing' && call.from === currentUser.id) {
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

  if (call.status === 'accepted') {
      return (
         <CallInterface>
            <div className="w-full max-w-xs">
                <p id="timer" className="font-mono text-2xl font-bold mb-8 text-green-500">{timer}</p>
                 <div className="flex justify-around items-center">
                    <Button onClick={() => updateCallStatus(callId, 'ended')} variant="destructive" size="icon" className="w-20 h-20 rounded-full">
                        <PhoneOff className="w-8 h-8" />
                    </Button>
                </div>
            </div>
        </CallInterface>
      )
  }
  
  const EndCallMessage = () => {
      let message = "Call Ended";
      if (call.status === 'rejected') message = "Call Declined";
      if (call.status === 'timeout') message = "Call Timed Out";
      if (call.status === 'ended') message = "Call Ended";
      return <p>{message}</p>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-lg font-semibold">
      <EndCallMessage />
    </div>
  );
}
