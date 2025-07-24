'use client';
import { notFound, useParams } from 'next/navigation';
import { getConversationById, getUserById, currentUser } from '@/lib/data';
import { MainHeader } from '@/components/layout/main-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Phone, Mic, Paperclip, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

export default function ChatPage() {
  const params = useParams();
  const { toast } = useToast();
  const convoId = params.id as string;
  const conversation = getConversationById(convoId);

  if (!conversation) {
    notFound();
  }
  
  const otherUser = conversation.participants.find(p => p.id !== currentUser.id);

  if (!otherUser) {
    notFound();
  }

  const handleCall = () => {
    toast({
        title: "Calling...",
        description: `Starting a voice call with ${otherUser.name}. This is a UI demo.`
    });
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
          <Input placeholder="Type a message..." className="flex-1"/>
          <Button size="icon" className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
