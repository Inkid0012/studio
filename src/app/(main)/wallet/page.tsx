
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainHeader } from '@/components/layout/main-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, WalletCards, History, ArrowUp, Loader2, ChevronRight, Phone } from 'lucide-react';
import { getCurrentUser, addTransaction, createUserInFirestore, setCurrentUser } from '@/lib/data';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import type { User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const coinPackages = [
  { amount: 500, price: 60 },
  { amount: 1000, price: 140 },
  { amount: 2000, price: 300 },
  { amount: 5000, price: 800 },
  { amount: 10000, price: 1600 },
  { amount: 20000, price: 3300 },
  { amount: 50000, price: 8300, popular: true },
  { amount: 100000, price: 16700 },
];

const CoinIcon = () => (
    <div className="relative w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 shadow-md">
        <span className="font-bold text-xl text-white italic">S</span>
    </div>
);

export default function WalletPage() {
  const router = useRouter();
  const [currentUser, setCurrentUserFromState] = useState<User | null>(null);
  const [selectedPackage, setSelectedPackage] = useState(coinPackages[0]);
  const [isFolded, setIsFolded] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
        setCurrentUserFromState(user);
    } else {
        router.push('/login');
    }
  }, [router]);

  const displayedPackages = isFolded ? coinPackages.slice(0, 6) : coinPackages;
  
  const handlePurchase = async () => {
    if (!currentUser || !phoneNumber.trim()) {
        toast({
            variant: 'destructive',
            title: 'Phone Number Required',
            description: 'Please enter a valid M-Pesa phone number.',
        });
        return;
    }
    setIsProcessing(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
        const updatedUser: User = {
            ...currentUser,
            coins: currentUser.coins + selectedPackage.amount,
        };

        await createUserInFirestore(updatedUser);
        setCurrentUser(updatedUser);
        setCurrentUserFromState(updatedUser);

        addTransaction({
            userId: currentUser.id,
            type: 'purchase',
            amount: selectedPackage.amount,
            description: `Purchased ${selectedPackage.amount.toLocaleString()} coins`,
        });

        toast({
            title: 'Purchase Successful',
            description: `You have successfully purchased ${selectedPackage.amount.toLocaleString()} coins.`,
        });

    } catch (error) {
         toast({
            variant: 'destructive',
            title: 'Purchase Failed',
            description: 'There was an error processing your purchase. Please try again.',
        });
        console.error("Purchase failed", error);
    } finally {
        setIsProcessing(false);
        setPaymentDialogOpen(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary"/>
      </div>
    );
  }

  return (
    <div>
      <MainHeader title="Wallet" showBackButton={true}>
        <Button variant="ghost" size="icon" onClick={() => router.push('/wallet/history')}>
            <History className="h-6 w-6" />
        </Button>
      </MainHeader>

      <div className="p-4 space-y-6 pb-24">
        <Card>
            <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">My Balance</p>
                <div className="flex items-center gap-2 mt-2">
                    <CoinIcon />
                    <span className="text-4xl font-bold">{currentUser.coins.toLocaleString()}</span>
                </div>
            </CardContent>
        </Card>

        <div>
            <div className="flex items-center justify-between mb-2">
                <p className="font-semibold">Recharge</p>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100 text-orange-600 text-xs">
                    <WalletCards className="h-4 w-4" />
                    <span>{currentUser.country || 'Kenya'}</span>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
                {displayedPackages.map((pkg) => (
                    <button 
                        key={pkg.amount} 
                        onClick={() => setSelectedPackage(pkg)} 
                        className={cn(
                            "relative flex flex-col items-center justify-center p-3 rounded-lg border bg-background transition-all duration-200",
                            selectedPackage.amount === pkg.amount ? 'border-primary ring-2 ring-primary/50' : 'border-border'
                        )}
                    >
                         {pkg.popular && <div className="absolute top-0 right-0 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-bl-lg rounded-tr-md">Popular</div>}
                        <CoinIcon />
                        <span className="font-bold mt-1 text-sm">{pkg.amount.toLocaleString()}</span>
                         {selectedPackage.amount === pkg.amount && (
                            <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                <Check className="w-3 h-3 text-white"/>
                            </div>
                        )}
                    </button>
                ))}
            </div>
            
            <div className="flex justify-center mt-4">
                <Button variant="ghost" onClick={() => setIsFolded(!isFolded)} className="text-muted-foreground text-xs">
                    {isFolded ? 'Show More' : 'Fold'}
                    <ArrowUp className={cn("h-4 w-4 ml-1 transition-transform", !isFolded && "rotate-180")} />
                </Button>
            </div>
        </div>
      </div>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogTrigger asChild>
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
                <Button className="w-full h-14 bg-green-500 hover:bg-green-600 text-white text-lg">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                            <Image src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/M-PESA_LOGO-01.svg/1280px-M-PESA_LOGO-01.svg.png" alt="M-Pesa" width={60} height={20} className="filter brightness-0 invert" />
                        </div>
                        <span className="font-semibold">KES {selectedPackage.price.toLocaleString()}</span>
                        <ChevronRight className="h-5 w-5 opacity-70" />
                    </div>
                </Button>
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
                <DialogTitle>Confirm M-Pesa Payment</DialogTitle>
                <DialogDescription>
                    Enter your phone number to complete the purchase of {selectedPackage.amount.toLocaleString()} coins for KES {selectedPackage.price.toLocaleString()}.
                </DialogDescription>
            </DialogHeader>
            <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    type="tel" 
                    placeholder="e.g. 0712345678" 
                    className="pl-10"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                />
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline" disabled={isProcessing}>Cancel</Button>
                </DialogClose>
                <Button onClick={handlePurchase} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Confirm Purchase
                </Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
