
'use client';
import { notFound, useParams } from 'next/navigation';
import { addTransaction, getConversationById, getUserById, getCurrentUser, setCurrentUser, createUserInFirestore, CHARGE_COSTS } from '@/lib/data';
import { MainHeader } from '@/components/layout/main-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Phone, Mic, Paperclip, Send, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { Conversation, User, Message } from '@/types';
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function ChatPage() {
  const params = useParams();
  const { toast } = useToast();
  const router = useRouter();
  const convoId = params.id as string;
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [currentUser, setCurrentUserFromState] = useState<User | null>(getCurrentUser());
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showRechargeDialog, setShowRechargeDialog] = useState(false);
  const [rechargeContext, setRechargeContext] = useState<{title: string, description: string}>({title: '', description: ''});

  useEffect(() => {
    const fetchConvo = async () => {
      const convoData = await getConversationById(convoId);
      if (convoData) {
        setConversation(convoData);
        const other = convoData.participants.find(p => p.id !== currentUser?.id);
        setOtherUser(other || null);
      } else {
        notFound();
      }
    };
    if (currentUser) {
        fetchConvo();
    } else {
        router.push('/login');
    }
  }, [convoId, currentUser, router]);
  
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

  const handleSendMessage = async () => {
      if (!messageText.trim()) return;

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

      const newMessage: Message = {
          id: `msg-${Date.now()}`,
          senderId: currentUser.id,
          text: messageText,
          timestamp: new Date(),
          type: 'text',
          content: messageText,
      };

      setConversation(prev => prev ? { ...prev, messages: [...prev.messages, newMessage] } : null);
      setMessageText('');

      toast({
          title: 'Message Sent',
      });
  };

  const handleCall = async () => {
     if (currentUser.coins < CHARGE_COSTS.call) {
        handleInsufficientCoins('call');
        return;
    }

    const updatedUser = { ...currentUser, coins: currentUser.coins - CHARGE_COSTS.call };
    setCurrentUserFromState(updatedUser);
    setCurrentUser(updatedUser);
    await createUserInFirestore(updatedUser);
    await addTransaction({
        type: 'spent',
        amount: CHARGE_COSTS.call,
        description: `Voice call with ${otherUser.name}`,
        userId: currentUser.id,
    });
      
    toast({
        title: "Calling...",
        description: `Starting a voice call with ${otherUser.name}. ${CHARGE_COSTS.call} coins deducted.`
    });

    router.push(`/call/${convoId}?otherUserId=${otherUser.id}`);
  }

  return (
    <div className="flex flex-col h-screen">
        <MainHeader title={otherUser.name} showBackButton={true}>
            <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src={otherUser.profilePicture} alt={otherUser.name} data-ai-hint="portrait person" />
                <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={handleCall} className="text-accent hover:text-accent">
                <Phone className="h-5 w-5" />
            </Button>
        </MainHeader>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {conversation.messages.map((message) => (
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
                    : 'bg-muted text-foreground rounded-bl-none'
                )}
              >
                <p className="text-sm">{message.text}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t bg-background">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-accent">
            <Paperclip className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-accent">
            <Mic className="h-5 w-5" />
          </Button>
          <Input 
            placeholder="Type a message..." 
            className="flex-1"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button size="icon" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleSendMessage}>
            <Send className="h-5 w-5" />
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
