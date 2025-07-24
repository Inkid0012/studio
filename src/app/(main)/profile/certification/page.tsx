
'use client';

import { MainHeader } from "@/components/layout/main-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState, useRef, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser, setCurrentUser, createUserInFirestore } from "@/lib/data";
import type { User } from "@/types";

export default function CertificationPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isCertified, setIsCertified] = useState(false);
    const [currentUser, setCurrentUserFromState] = useState<User | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const user = getCurrentUser();
        if (user) {
            setCurrentUserFromState(user);
            setIsCertified(user.isCertified);
        } else {
            router.push('/login');
        }
    }, [router]);
    
    const handleCertificationClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setCapturedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const submitCertification = async () => {
        if (!capturedImage || !currentUser) return;
        
        setIsLoading(true);
        try {
            // In a real app, you would upload the image to storage and send it for verification.
            // For this demo, we'll just mark the user as certified.
            const updatedUser = { ...currentUser, isCertified: true };
            await createUserInFirestore(updatedUser);
            setCurrentUser(updatedUser);
            
            setIsCertified(true);
            
            toast({
                title: 'Certification Submitted!',
                description: 'Your profile is now certified.',
            });
             router.push('/profile');
            
        } catch (error) {
            console.error('Certification failed:', error);
            toast({
                variant: 'destructive',
                title: 'Certification Failed',
                description: 'Could not update your profile. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="bg-muted/30 min-h-screen">
            <MainHeader title="Certification" showBackButton={true} />
            <div className="p-4 space-y-6 pb-24">
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-bold text-lg mb-2">Certification Requirements</h3>
                        <ul className="space-y-2">
                            <li className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                <span>Make sure that the photo and avatar are the same person</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                <span>Ok gesture</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>
                
                <Card className="overflow-hidden">
                    <CardContent className="p-0 relative aspect-[3/4]">
                        {capturedImage ? (
                            <Image src={capturedImage} alt="Captured photo for certification" layout="fill" objectFit="cover" />
                        ) : (
                            <Image src="https://placehold.co/600x800.png" data-ai-hint="person ok gesture" alt="Certification example" layout="fill" objectFit="cover" />
                        )}
                    </CardContent>
                </Card>
                
                 {capturedImage && !isCertified && (
                    <Button onClick={submitCertification} disabled={isLoading} className="w-full h-12 bg-primary text-primary-foreground text-lg">
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                            </>
                        ) : 'Submit for Certification'}
                    </Button>
                )}
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t">
                <Button 
                    onClick={handleCertificationClick} 
                    disabled={isCertified || isLoading}
                    className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white text-lg"
                >
                    {isCertified ? 'Certified' : 'Certify Now'}
                </Button>
                <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>
        </div>
    );
}
