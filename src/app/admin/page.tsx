'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/hooks/use-language';
import { AuthLoader } from '@/components/auth-loader';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle, Shield, ShieldOff, Trash2 } from 'lucide-react';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { AddUserDialog } from '@/components/admin/add-user-dialog';

export default function AdminPage() {
  const { user, users, isLoading, deleteUser, updateUserRole } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const [isAddUserDialogOpen, setAddUserDialogOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user || user.role !== 'admin') {
        router.replace('/dashboard');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'admin') {
    return <AuthLoader />;
  }

  return (
    <>
      <div className="p-4 md:p-8">
        <h1 className="text-3xl font-headline mb-6">{t('admin.dashboardTitle')}</h1>
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.usersTable')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.username')}</TableHead>
                  <TableHead>{t('admin.phoneNumber')}</TableHead>
                  <TableHead>{t('admin.role')}</TableHead>
                  <TableHead className="text-right">{t('admin.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-medium">{u.username}</div>
                       {u.username !== 'HUNTER' && (
                        <div className="flex items-center gap-2 mt-2">
                            {u.role !== 'admin' ? (
                                <Button variant="outline" size="xs" onClick={() => updateUserRole(u.id, 'admin')}>
                                    <Shield className="mr-1 h-3 w-3" />
                                    {t('admin.makeAdmin')}
                                </Button>
                            ) : (
                                <Button variant="secondary" size="xs" onClick={() => updateUserRole(u.id, 'user')}>
                                    <ShieldOff className="mr-1 h-3 w-3" />
                                    {t('admin.removeAdmin')}
                                </Button>
                            )}
                            <ConfirmationDialog
                                trigger={
                                    <Button variant="destructive" size="xs">
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                }
                                title={t('admin.deleteUserTitle')}
                                description={`${t('admin.deleteUserDesc')} (${u.username})?`}
                                onConfirm={() => deleteUser(u.id)}
                            />
                        </div>
                       )}
                    </TableCell>
                    <TableCell dir="ltr">{u.phoneNumber}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="border-t px-6 py-3">
             <Button onClick={() => setAddUserDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('admin.addUser')}
            </Button>
          </CardFooter>
        </Card>
      </div>
      <AddUserDialog open={isAddUserDialogOpen} onOpenChange={setAddUserDialogOpen} />
    </>
  );
}
