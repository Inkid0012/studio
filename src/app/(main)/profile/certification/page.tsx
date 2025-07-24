
'use client';

import { MainHeader } from "@/components/layout/main-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Check, CheckCircle, Camera } from "lucide-react";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser, setCurrentUser, createUserInFirestore } from "@/lib/data";
import type { User } from "@/types";

export default function CertificationPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isCertified, setIsCertified] = useState(false);
    const [currentUser, setCurrentUserFromState] = useState<User | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
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

    const getCameraPermission = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            toast({
                variant: 'destructive',
                title: 'Camera Not Supported',
                description: 'Your browser does not support camera access.',
            });
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setHasCameraPermission(true);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            setHasCameraPermission(false);
            toast({
                variant: 'destructive',
                title: 'Camera Access Denied',
                description: 'Please enable camera permissions in your browser settings.',
            });
        }
    };
    
    const handleCertification = () => {
        if (!hasCameraPermission) {
            getCameraPermission();
        } else {
            takePhoto();
        }
    };

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const dataUrl = canvas.toDataURL('image/png');
            setCapturedImage(dataUrl);

            // Stop camera stream
            const stream = video.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            setHasCameraPermission(null);
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
                        <h3 className="font-bold text-lg mb-2">Certification Rewards</h3>
                        <ul className="space-y-1 text-muted-foreground list-decimal list-inside">
                            <li>Certification mark</li>
                            <li>Double the revenue</li>
                            <li>More exposure</li>
                        </ul>
                    </CardContent>
                </Card>

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
                        {hasCameraPermission === true && !capturedImage ? (
                            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                        ) : capturedImage ? (
                            <Image src={capturedImage} alt="Captured photo for certification" layout="fill" objectFit="cover" />
                        ) : (
                            <Image src="https://placehold.co/600x800.png" data-ai-hint="person ok gesture" alt="Certification example" layout="fill" objectFit="cover" />
                        )}
                         
                         {hasCameraPermission === false && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                <Alert variant="destructive" className="m-4">
                                    <AlertTitle>Camera Access Required</AlertTitle>
                                    <AlertDescription>
                                        Please allow camera access to use this feature.
                                    </AlertDescription>
                                </Alert>
                            </div>
                        )}
                        <canvas ref={canvasRef} className="hidden"></canvas>
                    </CardContent>
                </Card>
                
                 {capturedImage && (
                    <Button onClick={submitCertification} disabled={isLoading} className="w-full h-12 bg-primary text-primary-foreground text-lg">
                        {isLoading ? 'Submitting...' : 'Submit for Certification'}
                    </Button>
                )}
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t">
                <Button 
                    onClick={handleCertification} 
                    disabled={isCertified || isLoading}
                    className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white text-lg"
                >
                    {isCertified ? 'Certified' : (hasCameraPermission ? 'Take Photo' : 'Certify Now')}
                </Button>
            </div>
        </div>
    );
}
