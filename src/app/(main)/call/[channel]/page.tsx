
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import AgoraRTC, {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getUserById, getCurrentUser, CHARGE_COSTS, addTransaction, createUserInFirestore, setCurrentUser, endCallInFirestore } from '@/lib/data';
import type { User } from '@/types';
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

  const [callState, setCallState] = useState<'idle' | 'outgoing' | 'incoming' | 'active' | 'declined' | 'timeout' | 'ended'>('idle');
  const [timer, setTimer] = useState('00:00');
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [currentUser, setCurrentUserFromState] = useState<User | null>(null);
  
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const coinsUsedRef = useRef(0);
  const callStartTimeRef = useRef<number | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement>(null);
  const [showRechargeDialog, setShowRechargeDialog] = useState(false);

  const channelName = params.channel as string;
  const otherUserId = searchParams.get('otherUserId');
  const callType = searchParams.get('callType') as 'outgoing' | 'incoming' | null;

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || !otherUserId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Invalid call session.' });
      router.push('/discover');
      return;
    }
    setCurrentUserFromState(user);

    const initializeCall = async () => {
        const otherUserProfile = await getUserById(otherUserId);
        if (otherUserProfile) {
            setOtherUser(otherUserProfile);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not find user to call.' });
            router.push('/chat');
            return;
        }

        if (callType === 'outgoing') {
            if (user.gender === 'male' && user.coins < CHARGE_COSTS.call) {
                setShowRechargeDialog(true);
                return;
            }
            setCallState('outgoing');
            joinAgoraCall(true); // Join immediately for outgoing calls
        } else if (callType === 'incoming') {
            setCallState('incoming');
            timeoutRef.current = setTimeout(() => {
                setCallState('timeout');
                endAgoraCall(false); 
            }, 60000); // 60 second timeout for incoming call
        }
    }
    initializeCall();
    
    // Listen for the call ending via Firestore
    const handleRemoteEndCallEvent = () => handleRemoteEndCall();
    window.addEventListener('call-ended', handleRemoteEndCallEvent);

    return () => {
        window.removeEventListener('call-ended', handleRemoteEndCallEvent);
        if (client) {
            endAgoraCall(false);
        }
        if (ringtoneRef.current) {
            ringtoneRef.current.pause();
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherUserId, callType, router, toast]);

  const handleRemoteEndCall = () => {
      endAgoraCall(true, 'Call ended by other user.');
  }

  useEffect(() => {
    const handlePlayback = async () => {
      if ((callState === 'outgoing' || callState === 'incoming') && ringtoneRef.current) {
        try {
          ringtoneRef.current.loop = true;
          await ringtoneRef.current.play();
        } catch (error) {
          console.error("Ringtone autoplay failed:", error);
        }
      } else if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      }
    };
    handlePlayback();
  }, [callState]);
  
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


  const joinAgoraCall = async (isOutgoing = false) => {
    if (!currentUser || !channelName || client) return;

    if (ringtoneRef.current) {
        ringtoneRef.current.pause();
    }

    try {
        const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || '5f5749cfcb054a82b4c779444f675284';
        const token = null; // Using null token for testing/development environments

        client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

        client.on('user-published', async (user, mediaType) => {
            await client?.subscribe(user, mediaType);
            if (mediaType === 'audio') {
                if(callState !== 'active'){
                    setCallState('active');
                    startTimerAndCoins();
                }
                user.audioTrack?.play();
            }
        });

        client.on('user-unpublished', user => {});

        client.on('user-left', () => {
            endAgoraCall(true, 'Other user left the call.');
        });
        
        await client.join(appId, channelName, token, currentUser.id);

        localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        await client.publish([localAudioTrack]);
        
        if (isOutgoing) {
            // Already published, just waiting for the other user.
        } else {
             setCallState('active');
             startTimerAndCoins();
        }

    } catch (error) {
        console.error("Agora join failed", error);
        toast({ variant: 'destructive', title: 'Call Failed', description: 'Could not connect to the call.' });
        endAgoraCall(false);
    }
  };

  const endAgoraCall = async (showToast = true, reason?: string) => {
    if (callState === 'ended') return;

    setCallState('ended');
    await endCallInFirestore(channelName);
    
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
    
    if (ringtoneRef.current) {
        ringtoneRef.current.pause();
    }

    if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
    }
     if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
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
        if (router) {
            router.push('/discover');
        }
    }, 1500);
  };
  
  const handleAccept = () => {
    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
    }
    joinAgoraCall();
  };

  const handleDecline = () => {
    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
    }
    setCallState('declined');
    endAgoraCall(false);
  };
  
  const handleEndCall = () => {
    endAgoraCall(true);
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


  if (!otherUser || !currentUser) {
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


  if (callState === 'incoming') {
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
  
  if (callState === 'outgoing') {
      return (
        <CallInterface title="Ringing...">
            <div className="w-full max-w-xs">
                <div className="flex justify-around items-center">
                    <Button onClick={handleEndCall} variant="destructive" size="icon" className="w-20 h-20 rounded-full">
                        <PhoneOff className="w-8 h-8" />
                    </Button>
                </div>
            </div>
        </CallInterface>
      )
  }

  if (callState === 'active') {
      return (
         <CallInterface>
            <div className="w-full max-w-xs">
                <p id="timer" className="font-mono text-2xl font-bold mb-8 text-green-500">{timer}</p>
                 <div className="flex justify-around items-center">
                    <Button onClick={handleEndCall} variant="destructive" size="icon" className="w-20 h-20 rounded-full">
                        <PhoneOff className="w-8 h-8" />
                    </Button>
                </div>
            </div>
        </CallInterface>
      )
  }
  
  const EndCallMessage = () => {
      let message = "Call Ended";
      if (callState === 'declined') message = "Call Declined";
      if (callState === 'timeout') message = "Call Timed Out";
      return <p>{message}</p>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-lg font-semibold">
      <EndCallMessage />
    </div>
  );
}
