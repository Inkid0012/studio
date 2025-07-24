
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainHeader } from '@/components/layout/main-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, WalletCards, History, ArrowUp, Loader2 } from 'lucide-react';
import { getCurrentUser, addTransaction, createUserInFirestore, setCurrentUser } from '@/lib/data';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import type { User } from '@/types';
import { useToast } from '@/hooks/use-toast';

const coinPackages = [
  { amount: 500, price: 0.64 },
  { amount: 1000, price: 1.28 },
  { amount: 2000, price: 2.56 },
  { amount: 5000, price: 6.40 },
  { amount: 10000, price: 12.80 },
  { amount: 20000, price: 25.60 },
  { amount: 50000, price: 64.00, popular: true },
  { amount: 100000, price: 128.00 },
];

const CoinIcon = () => (
    <div className="relative w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 shadow-md">
        <span className="font-bold text-xl text-white italic">S</span>
    </div>
);

export default function WalletPage() {
  const router = useRouter();
  const [currentUser, setCurrentUserFromState] = useState<User | null>(getCurrentUser());
  const [selectedPackage, setSelectedPackage] = useState(coinPackages[0]);
  const [isFolded, setIsFolded] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const displayedPackages = isFolded ? coinPackages.slice(0, 6) : coinPackages;

  if (!currentUser) {
    // Handle case where user is not logged in
    return <div>Loading...</div>;
  }
  
  const handlePurchase = async () => {
    if (!currentUser) return;
    setIsProcessing(true);

    try {
        const updatedUser: User = {
            ...currentUser,
            coins: currentUser.coins + selectedPackage.amount,
        };

        await createUserInFirestore(updatedUser);
        setCurrentUser(updatedUser);
        setCurrentUserFromState(updatedUser);

        await addTransaction({
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
    }
  };


  return (
    <div className="bg-muted/30 min-h-screen">
      <MainHeader title="Wallet" showBackButton={true}>
        <Button variant="ghost" size="icon" onClick={() => router.push('/wallet/history')}>
            <History className="h-6 w-6" />
        </Button>
      </MainHeader>

      <div className="p-4 space-y-6">
        <Card>
            <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">My Balance</p>
                <div className="flex items-center gap-2 mt-2">
                    <CoinIcon />
                    <span className="text-4xl font-bold">{currentUser.coins}</span>
                </div>
            </CardContent>
        </Card>

        <div>
            <div className="flex items-center justify-between mb-2">
                <p className="font-semibold">My Balance</p>
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

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
          <Button onClick={handlePurchase} disabled={isProcessing} className="w-full h-14 bg-green-500 hover:bg-green-600 text-white text-lg">
                <div className="flex items-center justify-between w-full">
                    {isProcessing ? (
                        <Loader2 className="h-6 w-6 animate-spin mx-auto"/>
                    ) : (
                        <>
                            <div className="flex items-center gap-2">
                                <Image src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Google_Pay_logo.svg/1280px-Google_Pay_logo.svg.png" alt="GPay" width={48} height={20} className="filter invert brightness-0" />
                            </div>
                            <span className="font-semibold">USD {selectedPackage.price.toFixed(2)}</span>
                            <ChevronRight className="h-5 w-5 opacity-70" />
                        </>
                    )}
                </div>
            </Button>
      </div>
    </div>
  );
}


const ChevronRight = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
    </svg>
  );
