'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/hooks/use-language';
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
import { PlusCircle, Shield, ShieldOff, Trash2, Pencil, Ban } from 'lucide-react';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { AddUserDialog } from '@/components/admin/add-user-dialog';
import { EditUserDialog } from '@/components/admin/edit-user-dialog';
import type { StoredUser } from '@/types';
import { ScrollArea } from '../ui/scroll-area';

export function AdminPanel() {
  const { users, deleteUser, updateUserRole, toggleBanUser } = useAuth();
  const { t } = useLanguage();
  const [isAddUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<StoredUser | null>(null);
  
  const handleEditClick = (user: StoredUser) => {
    setUserToEdit(user);
    setEditUserDialogOpen(true);
  };

  return (
    <>
      <div className="py-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.usersTable')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-200px)]">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>{t('admin.username')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((u) => (
                    <TableRow key={u.id}>
                        <TableCell>
                        <div className="font-medium">{u.username}</div>
                        <div className="text-sm text-muted-foreground" dir="ltr">{u.email}</div>
                        <div className="text-sm text-muted-foreground" dir="ltr">{u.phoneNumber}</div>
                        <div className="text-sm text-muted-foreground" dir="ltr">Pass: {u.pass}</div>
                        <div className="my-2 flex flex-wrap gap-1">
                            <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                                {u.role}
                            </Badge>
                             {u.isBanned && (
                                <Badge variant="destructive">{t('admin.banned')}</Badge>
                            )}
                        </div>
                        {u.username !== 'HUNTER' && (
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <Button variant="outline" size="xs" onClick={() => handleEditClick(u)}>
                                    <Pencil className="mr-1 h-3 w-3" />
                                    {t('doctorCard.edit')}
                                </Button>
                                 <Button 
                                    variant={u.isBanned ? "default" : "destructive"} 
                                    size="xs" 
                                    onClick={() => toggleBanUser(u.id)}
                                >
                                    <Ban className="mr-1 h-3 w-3" />
                                    {u.isBanned ? t('admin.unbanUser') : t('admin.banUser')}
                                </Button>
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
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </ScrollArea>
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
      <EditUserDialog 
        open={isEditUserDialogOpen} 
        onOpenChange={setEditUserDialogOpen}
        userToEdit={userToEdit}
      />
    </>
  );
}
