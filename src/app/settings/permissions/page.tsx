
'use client';

import { useState, useEffect, useCallback } from 'react';
import { MainHeader } from '@/components/layout/main-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, HelpCircle, MapPin, Mic, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type PermissionState = 'granted' | 'denied' | 'prompt' | 'unavailable';

const PermissionRow = ({ label, icon: Icon, status, onRequest }: { label: string, icon: React.ElementType, status: PermissionState, onRequest: () => void }) => {
    
    const getStatusContent = () => {
        switch (status) {
            case 'granted':
                return { text: 'Granted', color: 'bg-green-100 text-green-800', icon: <Check className="h-4 w-4" /> };
            case 'denied':
                return { text: 'Denied', color: 'bg-red-100 text-red-800', icon: <X className="h-4 w-4" /> };
            case 'unavailable':
                 return { text: 'Unavailable', color: 'bg-yellow-100 text-yellow-800', icon: <HelpCircle className="h-4 w-4" /> };
            case 'prompt':
            default:
                return { text: 'Not Granted', color: 'bg-gray-100 text-gray-800', icon: <HelpCircle className="h-4 w-4" /> };
        }
    };

    const statusContent = getStatusContent();

    return (
        <div className="flex items-center justify-between py-3 border-b last:border-b-0">
            <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                <Badge className={cn("border-none", statusContent.color)}>
                    {statusContent.icon}
                    <span className="ml-1.5">{statusContent.text}</span>
                </Badge>
                {status === 'prompt' && (
                    <Button size="sm" variant="outline" onClick={onRequest}>Request</Button>
                )}
            </div>
        </div>
    )
};


export default function PermissionsPage() {
    const { toast } = useToast();
    const [cameraStatus, setCameraStatus] = useState<PermissionState>('prompt');
    const [micStatus, setMicStatus] = useState<PermissionState>('prompt');
    const [locationStatus, setLocationStatus] = useState<PermissionState>('prompt');

    const checkPermission = useCallback(async (name: 'camera' | 'microphone' | 'geolocation') => {
        if (!navigator.permissions) {
            return 'unavailable';
        }
        try {
            const result = await navigator.permissions.query({ name: name as PermissionName });
            return result.state as PermissionState;
        } catch (error) {
            console.warn(`Could not query permission for ${name}:`, error);
            // Some browsers (like Firefox for geolocation) might throw if not called from a secure context or after a user gesture.
            return 'prompt';
        }
    }, []);

    useEffect(() => {
        checkPermission('camera').then(setCameraStatus);
        checkPermission('microphone').then(setMicStatus);
        checkPermission('geolocation').then(setLocationStatus);
    }, [checkPermission]);

    const requestCamera = async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ video: true });
            toast({ title: 'Camera access granted!' });
            setCameraStatus('granted');
        } catch (error) {
            toast({ variant: 'destructive', title: 'Camera access denied' });
            setCameraStatus('denied');
        }
    };

    const requestMic = async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            toast({ title: 'Microphone access granted!' });
            setMicStatus('granted');
        } catch (error) {
            toast({ variant: 'destructive', title: 'Microphone access denied' });
            setMicStatus('denied');
        }
    };

    const requestLocation = () => {
        if (!('geolocation' in navigator)) {
            setLocationStatus('unavailable');
            toast({ variant: 'destructive', title: 'Geolocation is not available' });
            return;
        }
        navigator.geolocation.getCurrentPosition(
            () => {
                toast({ title: 'Location access granted!' });
                setLocationStatus('granted');
            },
            () => {
                toast({ variant: 'destructive', title: 'Location access denied' });
                setLocationStatus('denied');
            }
        );
    };

    return (
        <div className="min-h-screen bg-muted/30">
            <MainHeader title="App Permissions" showBackButton={true} />
            <div className="p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Manage Permissions</CardTitle>
                        <CardDescription>
                            Fizu requires certain permissions to provide the best experience. You can manage them here.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-2">
                        <PermissionRow label="Camera" icon={Camera} status={cameraStatus} onRequest={requestCamera} />
                        <PermissionRow label="Microphone" icon={Mic} status={micStatus} onRequest={requestMic} />
                        <PermissionRow label="Location" icon={MapPin} status={locationStatus} onRequest={requestLocation} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
