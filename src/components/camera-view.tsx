
"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Camera, X, RefreshCcw, Check } from "lucide-react";
import Image from "next/image";

interface CameraViewProps {
    onCapture: (imageDataUrl: string) => void;
    onCancel: () => void;
}

export function CameraView({ onCapture, onCancel }: CameraViewProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        let stream: MediaStream | null = null;
        const getCameraPermission = async () => {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.error("Camera API not supported in this browser.");
                setHasCameraPermission(false);
                toast({
                    variant: "destructive",
                    title: "Unsupported Browser",
                    description: "Your browser does not support camera access.",
                });
                return;
            }

            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
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

        if (!capturedImage) {
            getCameraPermission();
        }
        
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        }
    }, [toast, capturedImage]);

    const handleCaptureClick = () => {
        if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            const context = canvas.getContext('2d');
            
            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                
                context.translate(video.videoWidth, 0);
                context.scale(-1, 1);

                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const dataUrl = canvas.toDataURL('image/png');
                setCapturedImage(dataUrl);

                // Stop the camera stream
                 if (videoRef.current && videoRef.current.srcObject) {
                    const stream = videoRef.current.srcObject as MediaStream;
                    stream.getTracks().forEach(track => track.stop());
                }
            }
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
    }

    const handleUsePhoto = () => {
        if (capturedImage) {
            onCapture(capturedImage);
        }
    }

    return (
        <div className="space-y-4">
            <h3 className="font-headline text-lg">{capturedImage ? "Photo Preview" : "Take Photo"}</h3>
            <div className="relative">
                {capturedImage ? (
                    <Image src={capturedImage} alt="Captured photo" width={400} height={300} className="w-full aspect-video rounded-md bg-muted" />
                ) : (
                    <>
                        <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted transform -scale-x-100" autoPlay muted playsInline />
                        <canvas ref={canvasRef} className="hidden" />
                        {hasCameraPermission === false && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md">
                                <Alert variant="destructive" className="w-auto">
                                    <AlertTitle>Camera Access Required</AlertTitle>
                                    <AlertDescription>
                                        Please allow camera access.
                                    </AlertDescription>
                                </Alert>
                            </div>
                        )}
                    </>
                )}
            </div>
           
            <div className="flex justify-between">
                {capturedImage ? (
                    <>
                        <Button variant="outline" onClick={handleRetake}>
                            <RefreshCcw className="mr-2 h-4 w-4"/>
                            Retake
                        </Button>
                        <Button onClick={handleUsePhoto}>
                            <Check className="mr-2 h-4 w-4"/>
                            Use Photo
                        </Button>
                    </>
                ) : (
                    <>
                        <Button variant="ghost" onClick={onCancel}>
                            <X className="mr-2 h-4 w-4"/>
                            Cancel
                        </Button>
                        <Button onClick={handleCaptureClick} disabled={!hasCameraPermission}>
                            <Camera className="mr-2 h-4 w-4"/>
                            Capture
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
