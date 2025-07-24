
'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { MainHeader } from '@/components/layout/main-header';
import { Card, CardContent } from '@/components/ui/card';
import { getTransactionsForUser, getCurrentUser } from '@/lib/data';
import type { Transaction, User } from '@/types';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const CoinIcon = () => (
    <div className="relative w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 shadow-md">
        <span className="font-bold text-xl text-white italic">S</span>
    </div>
);

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      const userTransactions = getTransactionsForUser(currentUser.id);
      setTransactions(userTransactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    }
  }, []);

  if (!user) {
    return (
        <div>
            <MainHeader title="Transaction History" showBackButton={true} />
            <div className="p-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                ))}
            </div>
        </div>
    );
  }

  return (
    <div className="bg-muted/30 min-h-screen">
      <MainHeader title="Transaction History" showBackButton={true} />
      <div className="p-4 space-y-4">
        {transactions.map((tx) => (
          <Card key={tx.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", tx.type === 'purchase' ? 'bg-green-100' : 'bg-red-100')}>
                     {tx.type === 'purchase' ? <ArrowDown className="h-5 w-5 text-green-600" /> : <ArrowUp className="h-5 w-5 text-red-600" />}
                 </div>
                 <div>
                    <p className="font-semibold">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(tx.timestamp), 'PPpp')}</p>
                 </div>
              </div>
              <div className="flex items-center gap-1">
                 <span className={cn("font-bold text-lg", tx.type === 'purchase' ? 'text-green-600' : 'text-red-600')}>
                    {tx.type === 'purchase' ? '+' : '-'}
                    {tx.amount}
                </span>
                <CoinIcon />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
