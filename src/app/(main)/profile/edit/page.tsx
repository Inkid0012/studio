'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getCurrentUser, setCurrentUser } from '@/lib/data';
import { MainHeader } from '@/components/layout/main-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Camera, Save, Upload, Video } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ChangeEvent, useRef, useState } from 'react';
import { CameraView } from '@/components/camera-view';

const profileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    age: z.coerce.number().min(18, "You must be at least 18 years old."),
    bio: z.string().max(500, "Bio can't be more than 500 characters.").min(10, "Bio must be at least 10 characters."),
});

type ProfileFormValues = Omit<z.infer<typeof profileSchema>, 'gender'>;

export default function EditProfilePage() {
    const { toast } = useToast();
    const router = useRouter();
    const currentUser = getCurrentUser();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [profilePic, setProfilePic] = useState(currentUser.profilePicture);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: currentUser.name,
            age: currentUser.age,
            bio: currentUser.bio,
        },
    });

    function onSubmit(values: ProfileFormValues) {
        const updatedUser = { ...currentUser, ...values, profilePicture: profilePic };
        setCurrentUser(updatedUser);
        
        toast({
            title: "Profile Updated",
            description: "Your changes have been saved successfully.",
        });
        router.push('/profile');
    }

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePic(reader.result as string);
                setDialogOpen(false);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleCapture = (imageDataUrl: string) => {
        setProfilePic(imageDataUrl);
        setShowCamera(false);
        setDialogOpen(false);
    }

    return (
        <div>
            <MainHeader title="Edit Profile" />
            <div className="p-4 md:p-8 max-w-2xl mx-auto">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <div className="flex justify-center">
                            <div className="relative">
                                <Avatar className="w-40 h-40 border-4 border-accent">
                                    <AvatarImage src={profilePic} alt={currentUser.name} data-ai-hint="portrait person"/>
                                    <AvatarFallback className="text-5xl">{currentUser.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button type="button" size="icon" className="absolute bottom-2 right-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                                            <Camera className="h-5 w-5"/>
                                            <span className="sr-only">Change photo</span>
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        {showCamera ? (
                                            <CameraView onCapture={handleCapture} onCancel={() => setShowCamera(false)} />
                                        ) : (
                                            <>
                                                <DialogHeader>
                                                    <DialogTitle>Change Profile Photo</DialogTitle>
                                                    <DialogDescription>
                                                        Take a new photo or upload one from your gallery.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <Button variant="outline" onClick={() => setShowCamera(true)}>
                                                        <Video className="mr-2 h-5 w-5"/>
                                                        Take Photo
                                                    </Button>
                                                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                                                        <Upload className="mr-2 h-5 w-5"/>
                                                        Upload
                                                    </Button>
                                                    <Input 
                                                        type="file" 
                                                        className="hidden" 
                                                        ref={fileInputRef} 
                                                        onChange={handleFileChange} 
                                                        accept="image/*"
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-headline">Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Your name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                         <FormField
                            control={form.control}
                            name="age"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-headline">Age</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="Your age" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="bio"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-headline">Bio</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Tell us about yourself..." {...field} rows={6} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold py-6 text-base">
                            <Save className="mr-2 h-5 w-5"/>
                            Save Changes
                        </Button>
                    </form>
                </Form>
            </div>
        </div>
    );
}
