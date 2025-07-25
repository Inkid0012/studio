
'use client';
import { notFound, useParams } from 'next/navigation';
import { addTransaction, getConversationById, getCurrentUser, setCurrentUser, createUserInFirestore, CHARGE_COSTS, getMessages, sendMessage, startCall } from '@/lib/data';
import { MainHeader } from '@/components/layout/main-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Phone, Mic, Paperclip, Send, Wallet, Video, Gift, Image as ImageIcon, Smile, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, useRef } from 'react';
import { Conversation, User, Message } from '@/types';
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function ChatPage() {
  const params = useParams();
  const { toast } = useToast();
  const router = useRouter();
  const convoId = params.id as string;
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUserFromState] = useState<User | null>(getCurrentUser());
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showRechargeDialog, setShowRechargeDialog] = useState(false);
  const [rechargeContext, setRechargeContext] = useState<{title: string, description: string}>({title: '', description: ''});
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchConvo = async () => {
      if (!currentUser) {
        router.push('/login');
        return;
      }
      const convoData = await getConversationById(convoId);
      if (convoData) {
        setConversation(convoData);
        const other = convoData.participants.find(p => p.id !== currentUser?.id);
        setOtherUser(other || null);
      } else {
        notFound();
      }
    };

    fetchConvo();
  }, [convoId, currentUser, router]);

  useEffect(() => {
    if (!convoId) return;

    const unsubscribe = getMessages(convoId, (newMessages) => {
        setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [convoId]);
  
  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [messages]);

  if (!conversation || !currentUser || !otherUser) {
    return <div>Loading chat...</div>;
  }

  const handleInsufficientCoins = (type: 'message' | 'call') => {
      const cost = type === 'message' ? CHARGE_COSTS.message : CHARGE_COSTS.call;
      setRechargeContext({
          title: 'Insufficient Coins',
          description: `You need ${cost} coins to ${type === 'message' ? 'send a message' : 'make a voice call'}. Please recharge.`
      });
      setShowRechargeDialog(true);
  };

  const handleSendMessage = async (text: string) => {
      const messageToSend = text.trim();
      if (!messageToSend) return;

      if (currentUser.gender === 'male') {
          if (currentUser.coins < CHARGE_COSTS.message) {
              handleInsufficientCoins('message');
              return;
          }
          const updatedUser = { ...currentUser, coins: currentUser.coins - CHARGE_COSTS.message };
          setCurrentUserFromState(updatedUser);
          setCurrentUser(updatedUser);
          await createUserInFirestore(updatedUser);
          await addTransaction({
              type: 'spent',
              amount: CHARGE_COSTS.message,
              description: `Message to ${otherUser.name}`,
              userId: currentUser.id,
          });
      }

      await sendMessage(convoId, currentUser.id, messageToSend);
      setMessageText('');
  };

  const handleCall = async () => {
     if (!currentUser || !otherUser) return;
     if (currentUser.gender === 'male' && currentUser.coins < CHARGE_COSTS.call) {
        handleInsufficientCoins('call');
        return;
    }
      
    const callId = await startCall(currentUser.id, otherUser.id);
    router.push(`/call/${callId}?otherUserId=${otherUser.id}&callType=outgoing`);
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
              <div
                className={cn('max-w-xs md:max-w-md rounded-2xl px-4 py-2', 
                  message.senderId === currentUser.id 
                    ? 'bg-primary text-primary-foreground rounded-br-none' 
                    : 'bg-card text-foreground rounded-bl-none shadow-sm'
                )}
              >
                <p className="text-sm">{message.text}</p>
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
      
      <div className="p-4 bg-background border-t">
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-accent">
                <Mic className="h-6 w-6" />
            </Button>
            <div className="flex-1 relative">
                <Input 
                    placeholder="Type a message..." 
                    className="pr-10 rounded-full bg-muted border-none"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(messageText)}
                />
                 <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-accent">
                    <Smile className="h-5 w-5" />
                </Button>
            </div>
            <Button size="icon" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full" onClick={() => handleSendMessage(messageText)}>
                <Send className="h-5 w-5" />
            </Button>
        </div>
         <div className="flex justify-around items-center mt-3">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-accent">
                <ImageIcon className="h-7 w-7" />
            </Button>
             <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-accent" onClick={handleCall}>
                <Phone className="h-7 w-7" />
            </Button>
             <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-accent">
                <Gift className="h-7 w-7" />
            </Button>
             <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-accent">
                <Video className="h-7 w-7" />
            </Button>
             <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-accent">
                <MessageCircle className="h-7 w-7" />
            </Button>
        </div>
      </div>
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

    
