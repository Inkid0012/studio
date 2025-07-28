
'use client';

import { MainHeader } from "@/components/layout/main-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, Loader2, Camera, VideoOff } from "lucide-react";
import Image from "next/image";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser, setCurrentUser, createUserInFirestore } from "@/lib/data";
import type { User } from "@/types";

export default function CertificationPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isCertified, setIsCertified] = useState(false);
    const [currentUser, setCurrentUserFromState] = useState<User | null>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

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
    
    useEffect(() => {
        const getCameraPermission = async () => {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({video: true});
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
              description: 'Please enable camera permissions in your browser settings to use this feature.',
            });
          }
        };
    
        if (!isCertified) {
            getCameraPermission();
        }

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        }
      }, [isCertified, toast]);
    

    const handleCapture = useCallback(() => {
        if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const context = canvas.getContext('2d');
          if (context) {
            // Flip the context horizontally for the mirror effect before drawing
            context.translate(video.videoWidth, 0);
            context.scale(-1, 1);
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            setCapturedImage(canvas.toDataURL('image/png'));
            
            if (videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
          }
        }
      }, []);

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
        <div>
            <MainHeader title="Certification" showBackButton={true} />
            <div className="p-4 space-y-6 pb-24">
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-bold text-lg mb-2">Certification Requirements</h3>
                        <ul className="space-y-2">
                            <li className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                <span>Position your face in the center of the frame.</span>
                            </li>
                             <li className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                <span>Make sure the lighting is good.</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>
                
                <Card className="overflow-hidden">
                    <CardContent className="p-0 relative aspect-[3/4]">
                        {capturedImage ? (
                            <Image src={capturedImage} alt="Captured photo for certification" layout="fill" objectFit="cover" />
                        ) : (
                            <div className="w-full h-full bg-black flex items-center justify-center">
                                <video ref={videoRef} className="w-full h-full object-cover transform -scale-x-100" autoPlay muted playsInline />
                                <canvas ref={canvasRef} className="hidden" />
                                {hasCameraPermission === false && (
                                    <div className="absolute text-white flex flex-col items-center gap-2">
                                        <VideoOff className="w-12 h-12" />
                                        <p>Camera access denied</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
                 {capturedImage && !isCertified ? (
                    <Button onClick={submitCertification} disabled={isLoading} className="w-full h-12 bg-primary text-primary-foreground text-lg">
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                            </>
                        ) : 'Submit for Certification'}
                    </Button>
                ) : !capturedImage && !isCertified ? (
                    <Button 
                        onClick={handleCapture} 
                        disabled={!hasCameraPermission}
                        className="w-full h-12 bg-primary text-primary-foreground text-lg"
                    >
                       <Camera className="mr-2 h-5 w-5" />
                        Capture Photo
                    </Button>
                ) : null}

                {isCertified && (
                    <Alert variant="default" className="bg-green-100 border-green-200">
                        <AlertTitle className="font-bold text-green-800">You are Certified!</AlertTitle>
                        <AlertDescription className="text-green-700">
                            Your profile now has a certification badge.
                        </AlertDescription>
                    </Alert>
                )}
            </div>
        </div>
    );
}
