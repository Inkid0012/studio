
'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { MainHeader } from '@/components/layout/main-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DeleteAllUsersPage() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletedCount, setDeletedCount] = useState(0);
  const { toast } = useToast();

  const handleDeleteAllUsers = async () => {
    if (!window.confirm('Are you absolutely sure you want to delete all users? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    setDeletedCount(0);

    try {
      const usersCollection = collection(db, 'users');
      const querySnapshot = await getDocs(usersCollection);
      const totalUsers = querySnapshot.size;

      if (totalUsers === 0) {
        toast({ title: 'No users to delete.' });
        setIsDeleting(false);
        return;
      }

      const batchArray: ReturnType<typeof writeBatch>[] = [];
      batchArray.push(writeBatch(db));
      let operationCount = 0;
      let batchIndex = 0;

      querySnapshot.forEach((userDoc) => {
        batchArray[batchIndex].delete(doc(db, 'users', userDoc.id));
        operationCount++;
        if (operationCount === 499) {
          batchArray.push(writeBatch(db));
          batchIndex++;
          operationCount = 0;
        }
      });

      await Promise.all(batchArray.map((batch) => batch.commit()));
      
      setDeletedCount(totalUsers);
      toast({
        title: 'Success!',
        description: `Successfully deleted ${totalUsers} user(s).`,
      });

    } catch (error) {
      console.error("Error deleting users:", error);
      toast({
        variant: 'destructive',
        title: 'Error Deleting Users',
        description: 'An error occurred. Please check the console for details.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <MainHeader title="Admin: Delete Users" />
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
                <AlertTriangle className="h-8 w-8 text-destructive"/>
                <CardTitle>Delete All Users</CardTitle>
            </div>
            <CardDescription>
              This is a destructive action that will permanently delete all user data from your Firestore 'users' collection. This cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {deletedCount > 0 && (
              <p className="text-green-600 mb-4">
                Successfully deleted {deletedCount} user(s). Your database is now empty.
              </p>
            )}
            <Button
              variant="destructive"
              onClick={handleDeleteAllUsers}
              disabled={isDeleting}
              className="w-full"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete All Users Now
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
