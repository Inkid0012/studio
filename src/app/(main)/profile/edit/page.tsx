
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getCurrentUser, setCurrentUser, createUserInFirestore, personalInfoOptions, countries } from '@/lib/data';
import { MainHeader } from '@/components/layout/main-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { CalendarIcon, Camera, ChevronRight, Save, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import type { User, PersonalInfoOption } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageCropper } from '@/components/image-cropper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OptionSelector } from '@/components/option-selector';


const profileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    dob: z.date({
        required_error: "A date of birth is required.",
    }),
    bio: z.string().max(500, "Bio can't be more than 500 characters.").min(10, "Bio must be at least 10 characters."),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function EditProfilePage() {
    const { toast } = useToast();
    const router = useRouter();
    const [currentUser, setCurrentUserFromState] = useState<User | null>(null);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [profilePic, setProfilePic] = useState<string | undefined>(undefined);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [dobPopoverOpen, setDobPopoverOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState<PersonalInfoOption | null>(null);


    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: '',
            bio: '',
        }
    });

    useEffect(() => {
        setIsMounted(true);
        const user = getCurrentUser();
        if (user) {
            setCurrentUserFromState(user);
            setProfilePic(user.profilePicture);
            form.reset({
                name: user.name,
                dob: user.dob ? new Date(user.dob) : undefined,
                bio: user.bio,
            });
        }
    }, [form]);

    const handleUpdate = (key: keyof User, value: any) => {
        if (currentUser) {
            const updatedUser = { ...currentUser, [key]: value };
            setCurrentUserFromState(updatedUser);
            setCurrentUser(updatedUser); // Update local storage
            // No toast here to avoid spamming. We save all at once.
        }
    };

    if (!isMounted || !currentUser) {
        return (
            <div>
                <MainHeader title="Edit Profile" />
                <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-8">
                     <div className="flex justify-center">
                         <Skeleton className="w-40 h-40 rounded-full" />
                     </div>
                     <Skeleton className="h-10 w-full" />
                     <Skeleton className="h-10 w-full" />
                     <Skeleton className="h-24 w-full" />
                     <Skeleton className="h-12 w-full" />
                </div>
            </div>
        )
    }

    if (selectedOption) {
        return (
            <OptionSelector 
                option={selectedOption}
                currentValue={currentUser[selectedOption.key] as string}
                onSelect={(value) => {
                    handleUpdate(selectedOption.key, value);
                    setSelectedOption(null);
                }}
                onBack={() => setSelectedOption(null)}
            />
        )
    }


    async function onSubmit(values: ProfileFormValues) {
        if (!currentUser) return;

        const today = new Date();
        const birthDate = new Date(values.dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        const updatedUser: User = { 
            ...currentUser, 
            name: values.name, 
            bio: values.bio, 
            dob: values.dob.toISOString(), 
            age: age, 
            profilePicture: profilePic || currentUser.profilePicture 
        };
        
        setCurrentUser(updatedUser); // Update local storage for immediate reflection
        await createUserInFirestore(updatedUser); // Update firestore
        
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
                setImageToCrop(reader.result as string);
                setUploadDialogOpen(false); 
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleCroppedImage = (croppedImage: string) => {
        setProfilePic(croppedImage);
        setImageToCrop(null);
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
                                    <AvatarImage src={profilePic} alt={currentUser.name} data-ai-hint="portrait person" className="object-cover" />
                                    <AvatarFallback className="text-5xl">{currentUser?.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button type="button" size="icon" className="absolute bottom-2 right-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                                            <Camera className="h-5 w-5"/>
                                            <span className="sr-only">Change photo</span>
                                        </Button>
                                    </DialogTrigger>
                                     <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Change Profile Photo</DialogTitle>
                                        </DialogHeader>
                                        <div className="grid grid-cols-1 gap-4">
                                            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                                <Upload className="mr-2 h-5 w-5"/>
                                                Upload from Gallery
                                            </Button>
                                            <Input 
                                                type="file" 
                                                className="hidden" 
                                                ref={fileInputRef} 
                                                onChange={handleFileChange} 
                                                accept="image/*"
                                            />
                                        </div>
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
                            name="dob"
                            render={({ field }) => {
                                const [tempDate, setTempDate] = useState<Date | undefined>(field.value);
                                
                                useEffect(() => {
                                    setTempDate(field.value);
                                }, [field.value]);

                                return (
                                <FormItem className="flex flex-col">
                                    <FormLabel className="font-headline">Date of birth</FormLabel>
                                    <Popover open={dobPopoverOpen} onOpenChange={setDobPopoverOpen}>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                            >
                                            {field.value ? (
                                                format(field.value, "PPP")
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={tempDate}
                                            onSelect={setTempDate}
                                            disabled={(date) =>
                                            date > new Date() || date < new Date("1900-01-01")
                                            }
                                            initialFocus
                                            captionLayout="dropdown-buttons"
                                            fromYear={1900}
                                            toYear={new Date().getFullYear()}
                                        />
                                        <div className="p-2 border-t border-border">
                                            <Button
                                                type="button"
                                                className="w-full"
                                                onClick={() => {
                                                    field.onChange(tempDate);
                                                    setDobPopoverOpen(false);
                                                }}
                                            >
                                                Confirm
                                            </Button>
                                        </div>
                                        </PopoverContent>
                                    </Popover>
                                    <FormDescription>
                                        Your age will be calculated from your date of birth.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                                )
                            }}
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

                        <Card>
                            <CardHeader>
                                <CardTitle className="font-headline text-lg">Personal Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <CountryRow 
                                    label="Country" 
                                    value={currentUser.country} 
                                    onCountryChange={(value) => handleUpdate('country', value)}
                                />
                                {personalInfoOptions.map((option) => (
                                    <InfoRow 
                                        key={option.key}
                                        label={option.label}
                                        value={currentUser[option.key] as string | undefined}
                                        icon={option.icon}
                                        onClick={() => setSelectedOption(option)}
                                    />
                                ))}
                            </CardContent>
                        </Card>


                        <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold py-6 text-base">
                            <Save className="mr-2 h-5 w-5"/>
                            Save Changes
                        </Button>
                    </form>
                </Form>
            </div>
             {imageToCrop && (
                <ImageCropper 
                    imageSrc={imageToCrop} 
                    onCropComplete={handleCroppedImage}
                    onClose={() => setImageToCrop(null)}
                />
            )}
        </div>
    );
}

const InfoRow = ({ label, value, icon: Icon, onClick }: { label: string; value?: string; icon?: React.ElementType; onClick: () => void; }) => (
    <button type="button" onClick={onClick} className="w-full flex items-center justify-between py-3 text-sm border-b border-border last:border-b-0">
        <div className="flex items-center gap-3">
            {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
            <span className="font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
            <span>{value || 'Add'}</span>
            <ChevronRight className="h-4 w-4" />
        </div>
    </button>
);

const CountryRow = ({ label, value, onCountryChange }: { label: string; value?: string; onCountryChange: (value: string) => void }) => (
    <div className="w-full flex items-center justify-between py-3 text-sm border-b border-border">
        <span className="font-medium">{label}</span>
        <Select value={value} onValueChange={onCountryChange}>
            <SelectTrigger className="w-[180px] border-none text-right justify-end gap-2 pr-0">
                <SelectValue placeholder="Select Country" />
            </SelectTrigger>
            <SelectContent>
                {countries.map(country => (
                    <SelectItem key={country} value={country}>
                        {country}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    </div>
);
