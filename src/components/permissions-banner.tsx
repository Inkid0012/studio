
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Mic, Camera, MapPin, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type PermissionState = 'granted' | 'denied' | 'prompt' | 'unavailable';
type PermissionName = 'camera' | 'microphone' | 'geolocation';

const PermissionIcon = () => (
    <div className="relative w-12 h-12 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full opacity-30"></div>
        <div className="relative w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-white" />
        </div>
    </div>
);


export function PermissionsBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const { toast } = useToast();
  
  const [permissions, setPermissions] = useState({
    camera: 'prompt' as PermissionState,
    microphone: 'prompt' as PermissionState,
    geolocation: 'prompt' as PermissionState,
  });

  const checkAllPermissions = useCallback(async () => {
    if (!navigator.permissions) return;
    try {
        const camera = await navigator.permissions.query({ name: 'camera' });
        const microphone = await navigator.permissions.query({ name: 'microphone' });
        const geolocation = await navigator.permissions.query({ name: 'geolocation' });

        const newPermissions = {
            camera: camera.state,
            microphone: microphone.state,
            geolocation: geolocation.state
        };
        setPermissions(newPermissions);

        // Show banner if any permission is still in 'prompt' state
        if (Object.values(newPermissions).some(p => p === 'prompt')) {
            setShowBanner(true);
        }

    } catch (error) {
        console.error("Error checking permissions:", error);
    }
  }, []);


  useEffect(() => {
    // Check permissions when component mounts
    checkAllPermissions();
  }, [checkAllPermissions]);

  const handleAllow = async () => {
    try {
        // Request Camera
        if (permissions.camera === 'prompt') {
            await navigator.mediaDevices.getUserMedia({ video: true });
        }
        // Request Microphone
        if (permissions.microphone === 'prompt') {
            await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        // Request Geolocation
        if (permissions.geolocation === 'prompt' && 'geolocation' in navigator) {
             await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });
        }
        
        toast({
            title: 'Permissions Updated!',
            description: 'Thank you for granting the necessary permissions.',
        });
        
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Permissions Denied',
            description: 'Some permissions were denied. You can enable them in browser settings.',
        });
    } finally {
        // Re-check permissions and hide the banner
        await checkAllPermissions();
        setShowBanner(false);
    }
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="relative p-4">
      <Card className="p-4 shadow-lg border-blue-200 bg-blue-50/50">
        <button
          onClick={() => setShowBanner(false)}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </button>
        <div className="flex items-center gap-4">
            <PermissionIcon />
          <div className="flex-1">
            <h3 className="font-bold">Enable all features</h3>
            <p className="text-sm text-muted-foreground">
              For the best experience, please grant permissions for your Camera, Microphone, and Location.
            </p>
          </div>
        </div>
        <div className="flex justify-end mt-3">
          <Button onClick={handleAllow} className="bg-primary text-primary-foreground rounded-full hover:bg-primary/90 h-9 px-6">
            Allow Permissions
          </Button>
        </div>
      </Card>
    </div>
  );
}
