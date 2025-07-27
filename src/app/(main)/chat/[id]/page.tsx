
'use client';
import { notFound, useParams } from 'next/navigation';
import { addTransaction, getConversationById, getCurrentUser, setCurrentUser, createUserInFirestore, CHARGE_COSTS, getMessages, sendMessage, getUserById, markMessagesAsRead } from '@/lib/data';
import { MainHeader } from '@/components/layout/main-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Phone, Mic, Send, Wallet, Image as ImageIcon, MessageCircle, Ban, Loader2, Circle, CheckCircle, Download, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, useRef, useMemo, ChangeEvent } from 'react';
import { Conversation, User, Message } from '@/types';
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import Link from 'next/link';
import { moderateMessage } from '@/ai/flows/moderate-chat-flow';
import { moderateImage } from '@/ai/flows/moderate-image-flow';
import { transcribeAudio } from '@/ai/flows/transcribe-audio-flow';
import Image from 'next/image';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

const AudioPlayer = ({ src }: { src: string }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            const handleEnded = () => setIsPlaying(false);
            audio.addEventListener('ended', handleEnded);
            return () => {
                audio.removeEventListener('ended', handleEnded);
            };
        }
    }, []);

    return (
        <div className="flex items-center gap-2 w-48" onClick={togglePlay}>
            <audio ref={audioRef} src={src} preload="auto" />
            <div className={`flex items-center justify-center h-8 w-8 rounded-full ${isPlaying ? 'bg-primary/20' : 'bg-muted'}`}>
                <div className={`h-2 w-1 rounded-full bg-primary transition-all ${isPlaying ? 'animate-[bounce_0.5s_ease-in-out_infinite] scale-y-100' : 'scale-y-50'}`} style={{ animationDelay: '0.1s' }}/>
                <div className={`h-3 w-1 rounded-full bg-primary transition-all mx-0.5 ${isPlaying ? 'animate-[bounce_0.5s_ease-in-out_infinite] scale-y-100' : 'scale-y-50'}`} style={{ animationDelay: '0.2s' }} />
                <div className={`h-2 w-1 rounded-full bg-primary transition-all ${isPlaying ? 'animate-[bounce_0.5s_ease-in-out_infinite] scale-y-100' : 'scale-y-50'}`} style={{ animationDelay: '0.3s' }}/>
            </div>
            <span className="text-xs text-muted-foreground">Voice Note</span>
        </div>
    );
};


export default function ChatPage() {
  const params = useParams();
  const { toast } = useToast();
  const router = useRouter();
  const convoId = params.id as string;
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUserFromState] = useState<User | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showRechargeDialog, setShowRechargeDialog] = useState(false);
  const [rechargeContext, setRechargeContext] = useState<{title: string, description: string}>({title: '', description: ''});
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUserFromState(user);

    const fetchConvo = async () => {
      setIsLoading(true);
      const convoData = await getConversationById(convoId);
      if (convoData) {
        setConversation(convoData);
        const otherParticipantId = convoData.participantIds.find(pId => pId !== user?.id);
        if (otherParticipantId) {
            const otherUserProfile = await getUserById(otherParticipantId);
            setOtherUser(otherUserProfile);
        } else {
            notFound();
        }
      } else {
        notFound();
      }
      setIsLoading(false);
    };

    fetchConvo();
  }, [convoId, router]);

  const isBlockedByYou = useMemo(() => currentUser?.blockedUsers?.includes(otherUser?.id || ''), [currentUser, otherUser]);
  const areYouBlocked = useMemo(() => otherUser?.blockedUsers?.includes(currentUser?.id || ''), [otherUser, currentUser]);
  const isBlocked = isBlockedByYou || areYouBlocked;

  useEffect(() => {
    if (!convoId || !currentUser?.id) return;

    const unsubscribe = getMessages(convoId, async (newMessages) => {
        setMessages(newMessages);

        const unreadMessageIds = newMessages
            .filter(msg => msg.senderId !== currentUser.id && !msg.readBy.includes(currentUser.id))
            .map(msg => msg.id);
        
        if (unreadMessageIds.length > 0) {
            await markMessagesAsRead(convoId, unreadMessageIds, currentUser.id);
        }
    });

    return () => unsubscribe();
  }, [convoId, currentUser?.id]);
  
  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [messages]);

  const handleInsufficientCoins = (type: Message['type']) => {
      const cost = CHARGE_COSTS.message;
      let item = 'send a message';
      if (type === 'image') item = 'send a photo';
      if (type === 'voice') item = 'send a voice note';

      setRechargeContext({
          title: 'Insufficient Coins',
          description: `You need ${cost} coins to ${item}. Please recharge.`
      });
      setShowRechargeDialog(true);
  };
  
  const handleSendMessage = async (content: string, type: Message['type'] = 'text') => {
    if (!content.trim() || !currentUser || isBlocked || isSending) return;

    setIsSending(true);

    try {
      if (type === 'text') {
        const moderationResult = await moderateMessage({ text: content });
        if (moderationResult.isBlocked) {
            toast({
                variant: 'destructive',
                title: 'Message Blocked',
                description: moderationResult.reason || 'This message violates our policy on sharing contact information.',
            });
            setIsSending(false);
            return;
        }
      }
      if (type === 'image') {
        const moderationResult = await moderateImage({ photoDataUri: content });
        if (moderationResult.isBlocked) {
          toast({
              variant: 'destructive',
              title: 'Image Blocked',
              description: moderationResult.reason || 'This image appears to contain numbers and cannot be sent.',
          });
          setIsSending(false);
          return;
        }
      }
      if (type === 'voice') {
        const transcriptionResult = await transcribeAudio({ audioDataUri: content });
        const moderationResult = await moderateMessage({ text: transcriptionResult.transcription });
        if (moderationResult.isBlocked) {
          toast({
              variant: 'destructive',
              title: 'Voice Note Blocked',
              description: "This voice note appears to contain numbers and cannot be sent.",
          });
          setIsSending(false);
          return;
        }
      }

      if (currentUser.gender === 'male') {
          const freshUser = await getUserById(currentUser.id);
          if (!freshUser || freshUser.coins < CHARGE_COSTS.message) {
              handleInsufficientCoins(type);
              setIsSending(false);
              return;
          }
          const updatedUser = { ...freshUser, coins: freshUser.coins - CHARGE_COSTS.message };
          setCurrentUserFromState(updatedUser);
          setCurrentUser(updatedUser);
          await createUserInFirestore(updatedUser);
          await addTransaction({
              type: 'spent',
              amount: CHARGE_COSTS.message,
              description: `${type.charAt(0).toUpperCase() + type.slice(1)} to ${otherUser?.name || 'user'}`,
              userId: currentUser.id,
          });
      }

      const success = await sendMessage(convoId, currentUser.id, content, type);
      if (success) {
        if (type === 'text') {
          setMessageText('');
        }
      } else {
        toast({ variant: 'destructive', title: 'Message not sent', description: 'You may have been blocked by this user.' });
      }
    } catch (error) {
        console.error("Error sending message:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not send message.' });
    } finally {
      setIsSending(false);
    }
  };

  const handleStartRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        const audioChunks: Blob[] = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorderRef.current.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                handleSendMessage(base64String, 'voice');
            };
            reader.readAsDataURL(audioBlob);
            stream.getTracks().forEach(track => track.stop()); // Stop microphone access
        };
        
        mediaRecorderRef.current.start();
        setIsRecording(true);
    } catch (err) {
        console.error("Microphone access denied:", err);
        toast({
            variant: 'destructive',
            title: 'Microphone Access Denied',
            description: 'Please allow microphone access in your browser settings.',
        });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            handleSendMessage(dataUrl, 'image');
        };
        reader.readAsDataURL(file);
    }
  };
  
  if (isLoading || !conversation || !currentUser || !otherUser) {
    return (
        <div className="flex flex-col h-screen bg-muted/20">
             <MainHeader title="Loading..." showBackButton={true} />
             <div className="flex-1 flex items-center justify-center">
                 <Loader2 className="w-8 h-8 animate-spin" />
             </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-muted/20">
        <MainHeader title={otherUser.name} showBackButton={true}>
            <span className='text-xs text-green-500 mr-2'>● Online</span>
             <Link href={`/profile/${otherUser.id}`}>
                <Avatar className="h-8 w-8">
                    <AvatarImage src={otherUser.profilePicture} alt={otherUser.name} data-ai-hint="portrait person" />
                    <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
            </Link>
        </MainHeader>

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef as any}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn('flex items-end gap-2', 
                message.senderId === currentUser.id ? 'justify-end' : 'justify-start'
              )}
            >
              {message.senderId !== currentUser.id && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={otherUser.profilePicture} alt={otherUser.name} data-ai-hint="portrait person" />
                  <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
              <div>
                <div
                    className={cn('max-w-xs md:max-w-md rounded-2xl px-4 py-2', 
                    message.type === 'image' || message.type === 'voice' ? 'p-1 bg-transparent' : '',
                    message.senderId === currentUser.id 
                        ? 'bg-primary text-primary-foreground rounded-br-none' 
                        : 'bg-card text-foreground rounded-bl-none shadow-sm'
                    )}
                >
                    {message.type === 'image' ? (
                        <Dialog>
                            <DialogTrigger asChild>
                                <Image src={message.content} alt="Sent image" width={200} height={200} className="rounded-md cursor-pointer" />
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl p-0">
                                <Image src={message.content} alt="Sent image" width={800} height={800} className="w-full h-auto" />
                                <a href={message.content} download={`image-${message.id}.png`} className="absolute bottom-4 right-4 bg-black/50 text-white p-2 rounded-full">
                                    <Download className="h-5 w-5" />
                                </a>
                            </DialogContent>
                        </Dialog>
                    ) : message.type === 'voice' ? (
                        <AudioPlayer src={message.content} />
                    ) : (
                        <p className="text-sm">{message.text}</p>
                    )}
                </div>
                 {message.senderId === currentUser.id && (
                    <div className="flex justify-end items-center mt-1 pr-1">
                        {message.readBy?.includes(otherUser.id) ? (
                            <CheckCircle className="h-4 w-4 text-blue-500" />
                        ) : (
                            <Circle className="h-3 w-3 text-muted-foreground" />
                        )}
                    </div>
                )}
              </div>
                {message.senderId === currentUser.id && (
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={currentUser.profilePicture} alt={currentUser.name} data-ai-hint="portrait person" />
                        <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                )}
            </div>
          ))}
        </div>
      </ScrollArea>
      
      {isBlocked ? (
        <div className="p-4 bg-background border-t text-center">
            <p className="text-sm text-destructive flex items-center justify-center gap-2">
                <Ban className="h-4 w-4" />
                {areYouBlocked ? 'You have been blocked by this user.' : 'Communication is blocked.'}
            </p>
        </div>
      ) : (
      <div className="p-4 bg-background border-t">
        <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("text-muted-foreground hover:text-accent", isRecording && 'text-red-500 animate-pulse')}
              onMouseDown={handleStartRecording}
              onMouseUp={handleStopRecording}
              onTouchStart={handleStartRecording}
              onTouchEnd={handleStopRecording}
            >
                <Mic className="h-6 w-6" />
            </Button>
            <div className="flex-1 relative">
                <Input 
                    placeholder="Type a message..." 
                    className="pr-4 rounded-full bg-muted border-none"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(messageText, 'text')}
                    disabled={isSending}
                />
            </div>
            <Button size="icon" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full" onClick={() => handleSendMessage(messageText, 'text')} disabled={isSending || !messageText}>
                {isSending && !fileInputRef.current?.value ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
        </div>
         <div className="flex justify-around items-center mt-3">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-accent" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon className="h-7 w-7" />
            </Button>
            <Input 
                type="file" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*"
                disabled={isSending}
            />
             <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-accent">
                <Phone className="h-7 w-7" />
            </Button>
             <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-accent">
                <MessageCircle className="h-7 w-7" />
            </Button>
        </div>
      </div>
      )}
       <AlertDialog open={showRechargeDialog} onOpenChange={setShowRechargeDialog}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{rechargeContext.title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {rechargeContext.description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => router.push('/wallet')} className="bg-green-500 hover:bg-green-600">
                        <Wallet className="mr-2 h-4 w-4" />
                        Recharge
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
