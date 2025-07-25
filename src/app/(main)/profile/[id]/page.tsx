
'use client';
import { notFound, useParams, useRouter } from 'next/navigation';
import { 
    getUserById, 
    addVisitor, 
    getCurrentUser, 
    findOrCreateConversation, 
    followUser, 
    unfollowUser, 
    setCurrentUser as setLocalUser,
    blockUser,
    unblockUser
} from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    CheckCircle, 
    MoreVertical, 
    MessageSquare, 
    ShieldAlert, 
    XCircle, 
    Loader2, 
    ChevronLeft, 
    Phone, 
    UserPlus, 
    ShieldCheck, 
    Ban,
    Upload
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useEffect, useState, useMemo, ChangeEvent, useRef } from 'react';
import type { User } from '@/types';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { submitUserReport } from '@/ai/flows/report-user-flow';

const calculateAge = (dob: string | Date) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const [user, setUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(getCurrentUser());
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportProof, setReportProof] = useState<string | null>(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (currentUser?.following) {
      setIsFollowing(currentUser.following.includes(userId));
    }
     if (currentUser?.blockedUsers) {
      setIsBlocked(currentUser.blockedUsers.includes(userId));
    }
  }, [currentUser, userId]);

  useEffect(() => {
    const fetchUser = async () => {
      const userProfile = await getUserById(userId);
      if (userProfile) {
        setUser(userProfile);
        if (currentUser && currentUser.id !== userId) {
          await addVisitor(userId, currentUser.id);
        }
      } else {
        notFound();
      }
    };

    fetchUser();
  }, [userId, currentUser]);

  const userAge = useMemo(() => {
    if (user?.dob) {
      return calculateAge(user.dob);
    }
    return user?.age || 0;
  }, [user]);

  const handleChat = async () => {
    if (!currentUser || !user) return;
    setIsProcessing(true);
    const conversationId = await findOrCreateConversation(currentUser.id, user.id);
    router.push(`/chat/${conversationId}`);
    setIsProcessing(false);
  };
  
  const handleCall = async () => {
      if (!currentUser || !user) return;
      setIsProcessing(true);
      const conversationId = await findOrCreateConversation(currentUser.id, user.id);
      router.push(`/call/${conversationId}?otherUserId=${user.id}`);
      setIsProcessing(false);
  };
  
  const handleFollow = async () => {
    if (!currentUser || !user) return;
    setIsProcessing(true);
    
    try {
      let updatedUser;
      if (isFollowing) {
        await unfollowUser(currentUser.id, userId);
        updatedUser = {
          ...currentUser,
          following: currentUser.following.filter(id => id !== userId)
        };
      } else {
        await followUser(currentUser.id, userId);
        updatedUser = {
          ...currentUser,
          following: [...currentUser.following, userId]
        };
      }
      setCurrentUser(updatedUser);
      setLocalUser(updatedUser);
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error("Failed to update follow status", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBlockToggle = async () => {
    if (!currentUser || !user) return;
    const action = isBlocked ? 'unblock' : 'block';
    
    try {
        let updatedUser;
        if (isBlocked) {
            await unblockUser(currentUser.id, userId);
             updatedUser = {
                ...currentUser,
                blockedUsers: currentUser.blockedUsers?.filter(id => id !== userId) || []
            };
        } else {
            await blockUser(currentUser.id, userId);
            updatedUser = {
                ...currentUser,
                blockedUsers: [...(currentUser.blockedUsers || []), userId]
            };
        }
        setCurrentUser(updatedUser);
        setLocalUser(updatedUser);
        setIsBlocked(!isBlocked);
        toast({ title: `User ${action}ed`, description: `You have successfully ${action}ed ${user.name}.` });
    } catch(err) {
        toast({ variant: 'destructive', title: `Failed to ${action} user`, description: "Please try again." });
    }
  };
  
  const handleReportFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
            setReportProof(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };
  
  const handleSubmitReport = async () => {
      if (!currentUser || !user || !reportReason || !reportDescription) {
          toast({ variant: 'destructive', title: 'Missing Information', description: 'Please fill out all fields to submit a report.'});
          return;
      }
      
      setIsSubmittingReport(true);
      try {
          const reportDetails = `Reason: ${reportReason}\nDescription: ${reportDescription}`;
          await submitUserReport({
              reportingUserId: currentUser.id,
              reportedUserId: user.id,
              reason: reportDetails,
              proofImage: reportProof,
          });
          toast({ title: 'Report Submitted', description: 'Thank you for your feedback. Our team will review your report.' });
          setReportDialogOpen(false);
          setReportReason('');
          setReportDescription('');
          setReportProof(null);
      } catch (err) {
          console.error("Report submission failed:", err);
          toast({ variant: 'destructive', title: 'Report Failed', description: 'Could not submit your report. Please try again.'});
      } finally {
          setIsSubmittingReport(false);
      }
  };


  if (!user || !currentUser) {
    return (
        <div className="bg-background min-h-screen">
            <div className="relative h-[50vh] bg-muted">
                <Skeleton className="h-full w-full" />
            </div>
            <div className="relative p-4 -mt-24">
                <Skeleton className="rounded-xl h-48 w-full" />
            </div>
            <div className="p-4 space-y-4">
                 <Skeleton className="rounded-xl h-24 w-full" />
                 <Skeleton className="rounded-xl h-24 w-full" />
            </div>
        </div>
    );
  }
  
  const canInteract = currentUser.id !== user.id && currentUser.gender !== user.gender;

  return (
    <div className="bg-muted/30 min-h-screen pb-32">
        <div className="relative h-[45vh]">
            <Image 
                src={user.profilePicture}
                alt={user.name}
                fill
                className="object-cover"
                data-ai-hint="portrait person"
                priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute top-4 left-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="bg-black/30 hover:bg-black/50 text-white rounded-full">
                    <ChevronLeft className="h-6 w-6" />
                </Button>
            </div>
            <div className="absolute top-4 right-4">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="bg-black/30 hover:bg-black/50 text-white rounded-full">
                            <MoreVertical className="h-6 w-6" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={handleBlockToggle}>
                            <Ban className="mr-2 h-4 w-4" />
                            <span>{isBlocked ? 'Unblock' : 'Block'} User</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setReportDialogOpen(true)}>
                            <ShieldAlert className="mr-2 h-4 w-4" />
                            <span>Report User</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>

        <div className="relative p-4 -mt-16 space-y-4">
            <div className="bg-card p-4 rounded-xl shadow-lg">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center">
                            {user.name}, {userAge}
                             {user.isCertified && <ShieldCheck className="ml-2 h-6 w-6 text-green-500 fill-green-200" />}
                        </h1>
                        <span className="text-sm text-muted-foreground">ID: {user.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg">💧</div>
                        <div className="text-center">
                            <div className="font-bold text-sm">0°C</div>
                            <div className="text-xs text-muted-foreground">Online</div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 mt-3">
                    <Badge className={user.gender === 'male' ? "bg-blue-100 text-blue-700" : "bg-pink-100 text-pink-700"}>
                        {user.gender === 'male' ? '♂' : '♀'} {userAge}
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-700">{user.country || 'Nigeria'}</Badge>
                </div>
            </div>

            <div className="bg-card p-4 rounded-xl shadow-lg">
                <h3 className="font-bold mb-2">Basic Information</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <p><span className="text-muted-foreground">Education:</span> {user.education || 'N/A'}</p>
                    <p><span className="text-muted-foreground">Smoking:</span> {user.smoking || 'N/A'}</p>
                    <p><span className="text-muted-foreground">Horoscope:</span> {user.horoscope || 'N/A'}</p>
                    <p><span className="text-muted-foreground">Liquor:</span> {user.liquor || 'N/A'}</p>
                </div>
            </div>

            <div className="bg-card p-4 rounded-xl shadow-lg">
                <h3 className="font-bold mb-2">Hobbies</h3>
                 <div className="flex flex-wrap gap-2">
                    {user.interests.length > 0 ? user.interests.map(interest => (
                        <Badge key={interest} variant="secondary" className="text-base py-1 px-3 bg-accent/20 text-accent-foreground border-accent/30">{interest}</Badge>
                    )) : <p className="text-sm text-muted-foreground">No hobbies listed.</p>}
                </div>
            </div>

             <div className="bg-card p-4 rounded-xl shadow-lg">
                <h3 className="font-bold mb-2">About Me</h3>
                <p className="text-muted-foreground text-sm">{user.bio || 'No bio provided.'}</p>
            </div>
        </div>

      {canInteract && !isBlocked && (
         <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t">
            <div className="max-w-md mx-auto grid grid-cols-3 gap-3">
                <Button 
                    onClick={handleFollow} 
                    disabled={isProcessing} 
                    variant={isFollowing ? 'secondary' : 'default'}
                    className="py-6 text-base"
                >
                    {isProcessing && !isFollowing ? <Loader2 className="animate-spin" /> : <UserPlus />}
                    {isFollowing ? 'Following' : 'Follow'}
                </Button>
                <Button onClick={handleCall} disabled={isProcessing} className="py-6 text-base bg-blue-500 hover:bg-blue-600 text-white">
                    {isProcessing ? <Loader2 className="animate-spin" /> : <Phone />}
                    Call
                </Button>
                <Button onClick={handleChat} disabled={isProcessing} className="py-6 text-base bg-accent text-accent-foreground hover:bg-accent/90">
                    {isProcessing ? <Loader2 className="animate-spin" /> : <MessageSquare />}
                    Chat
                </Button>
            </div>
        </div>
      )}
      {isBlocked && (
         <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t">
             <div className="max-w-md mx-auto text-center">
                <p className="text-destructive font-semibold mb-2">You have blocked this user.</p>
                <Button onClick={handleBlockToggle} variant="outline">Unblock</Button>
             </div>
         </div>
      )}

      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Report {user.name}</DialogTitle>
                    <DialogDescription>
                        Help us understand the problem. What is going on with this user?
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Select onValueChange={setReportReason} value={reportReason}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a reason" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="spam">Spam or Scam</SelectItem>
                            <SelectItem value="inappropriate_content">Inappropriate Content</SelectItem>
                            <SelectItem value="harassment">Harassment or Hate Speech</SelectItem>
                            <SelectItem value="impersonation">Impersonation</SelectItem>
                            <SelectItem value="underage">Underage User</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                    <Textarea 
                        placeholder="Please provide more details..."
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                        rows={4}
                    />
                     <div>
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="mr-2 h-4 w-4" />
                            {reportProof ? 'Change Proof' : 'Upload Proof (Optional)'}
                        </Button>
                        <Input 
                            type="file" 
                            className="hidden" 
                            ref={fileInputRef} 
                            onChange={handleReportFileChange} 
                            accept="image/*"
                        />
                        {reportProof && (
                            <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                                <Image src={reportProof} alt="Proof preview" width={40} height={40} className="rounded-md" />
                                <span>Image selected.</span>
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Cancel</Button>
                    </DialogClose>
                     <Button type="button" onClick={handleSubmitReport} disabled={isSubmittingReport}>
                        {isSubmittingReport && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Submit Report
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
