
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const NotificationIcon = () => (
    <div className="relative w-12 h-12 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full opacity-30"></div>
        <div className="relative w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center">
            <Bell className="w-6 h-6 text-white" />
            <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            </div>
        </div>
    </div>
);


export function NotificationPermissionBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      setShowBanner(true);
    }
  }, []);

  const handleAllow = async () => {
    if (!('Notification' in window)) {
      toast({
        variant: 'destructive',
        title: 'Notifications not supported',
        description: 'Your browser does not support desktop notifications.',
      });
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      toast({
        title: 'Notifications Enabled!',
        description: 'You will now receive chat notifications.',
      });
      setShowBanner(false);
    } else {
      toast({
        variant: 'destructive',
        title: 'Notifications Blocked',
        description: 'You have blocked notifications. You can enable them in your browser settings.',
      });
      setShowBanner(false);
    }
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="relative p-4">
      <Card className="p-4 shadow-lg">
        <button
          onClick={() => setShowBanner(false)}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </button>
        <div className="flex items-center gap-4">
            <NotificationIcon />
          <div className="flex-1">
            <h3 className="font-bold">Turn on message notifica...</h3>
            <p className="text-sm text-muted-foreground">
              Click to enable notification permission to receive chat messages in time.
            </p>
          </div>
        </div>
        <div className="flex justify-end mt-3">
          <Button onClick={handleAllow} className="bg-black text-white rounded-full hover:bg-gray-800 h-9 px-6">
            Allow
          </Button>
        </div>
      </Card>
    </div>
  );
}
