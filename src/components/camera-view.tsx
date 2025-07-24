"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Camera, X } from "lucide-react";

interface CameraViewProps {
    onCapture: (imageDataUrl: string) => void;
    onCancel: () => void;
}

export function CameraView({ onCapture, onCancel }: CameraViewProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const { toast } = useToast();

    useEffect(() => {
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
                    description: 'Please enable camera permissions in your browser settings to use this feature.',
                });
            }
        };

        getCameraPermission();
        
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        }
    }, [toast]);

    const handleCaptureClick = () => {
        if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            const context = canvas.getContext('2d');
            
            if (context) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const dataUrl = canvas.toDataURL('image/png');
                onCapture(dataUrl);
            }
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="font-headline text-lg">Take Photo</h3>
            <div className="relative">
                <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />
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
            </div>
           
            <div className="flex justify-between">
                <Button variant="ghost" onClick={onCancel}>
                    <X className="mr-2 h-4 w-4"/>
                    Cancel
                </Button>
                <Button onClick={handleCaptureClick} disabled={!hasCameraPermission}>
                    <Camera className="mr-2 h-4 w-4"/>
                    Capture
                </Button>
            </div>
        </div>
    );
}
