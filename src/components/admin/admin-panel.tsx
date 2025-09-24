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
import { PlusCircle, Shield, ShieldOff, Trash2, Pencil, CheckCircle, PowerOff, Power, ToggleRight, ToggleLeft, Copy, Check } from 'lucide-react';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { AddUserDialog } from '@/components/admin/add-user-dialog';
import { EditUserDialog } from '@/components/admin/edit-user-dialog';
import type { StoredUser, UserStatus } from '@/types';
import { ScrollArea } from '../ui/scroll-area';

const DynamicAdminCredentials = () => {
    const { users } = useAuth();
    const [hasCopied, setHasCopied] = useState(false);
    const ahmedAdmin = users.find(u => u.username === 'Ahmed');

    if (!ahmedAdmin) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(`Username: ${ahmedAdmin.username}\nPassword: ${ahmedAdmin.pass}`);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
    };

    return (
        <div className="mt-4 p-3 border border-dashed rounded-lg bg-secondary/50">
            <h3 className="text-sm font-semibold mb-2">Dynamic Admin Login:</h3>
            <div className="space-y-1 text-xs">
                <p><span className="font-medium">Username:</span> {ahmedAdmin.username}</p>
                <p className="flex items-center gap-2"><span className="font-medium">Password:</span> <span className="font-mono bg-muted px-1 py-0.5 rounded">{ahmedAdmin.pass}</span></p>
            </div>
            <Button size="xs" variant="outline" onClick={handleCopy} className="mt-2 w-full">
                {hasCopied ? <Check className="mr-2 h-4 w-4 text-success" /> : <Copy className="mr-2 h-4 w-4" />}
                {hasCopied ? 'Copied!' : 'Copy Credentials'}
            </Button>
        </div>
    );
};


export function AdminPanel() {
  const { users, deleteUser, updateUserRole, toggleUserActiveStatus, approveUser, isApprovalSystemEnabled, toggleApprovalSystem } = useAuth();
  const { t } = useLanguage();
  const [isAddUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<StoredUser | null>(null);
  
  const handleEditClick = (user: StoredUser) => {
    setUserToEdit(user);
    setEditUserDialogOpen(true);
  };

  const getStatusBadgeVariant = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'banned':
        return 'destructive';
      default:
        return 'secondary';
    }
  };
  
  const getStatusTranslationKey = (status: UserStatus) => {
    if (status === 'banned') return 'deactivated';
    return status;
  }

  // Filter out the current admin user (HUNTER) from the list to prevent self-modification
  const displayUsers = users.filter(u => u.username !== 'HUNTER');

  return (
    <>
      <div className="py-4">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <CardTitle>{t('admin.usersTable')}</CardTitle>
              <div className="flex flex-col gap-2">
                  <Button onClick={toggleApprovalSystem} variant={isApprovalSystemEnabled ? "secondary" : "default"} size="sm">
                    {isApprovalSystemEnabled ? <ToggleRight className="mr-2 h-4 w-4" /> : <ToggleLeft className="mr-2 h-4 w-4" />}
                    {t('admin.approvalSystem')}
                  </Button>
                  <DynamicAdminCredentials />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-250px)]">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>{t('admin.username')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {displayUsers.map((u) => (
                    <TableRow key={u.id}>
                        <TableCell>
                        <div className="font-medium">{u.username}</div>
                        <div className="text-sm text-muted-foreground" dir="ltr">{u.email}</div>
                        <div className="text-sm text-muted-foreground" dir="ltr">{u.phoneNumber}</div>
                        <div className="my-2 flex flex-wrap gap-1">
                            <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                                {u.role}
                            </Badge>
                            <Badge variant={getStatusBadgeVariant(u.status)}>
                                {t(`admin.status.${getStatusTranslationKey(u.status)}`)}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Button variant="outline" size="xs" onClick={() => handleEditClick(u)}>
                                <Pencil className="mr-1 h-3 w-3" />
                                {t('doctorCard.edit')}
                            </Button>
                            {u.status === 'pending' && isApprovalSystemEnabled && (
                              <Button variant="success" size="xs" onClick={() => approveUser(u.id)}>
                                <CheckCircle className="mr-1 h-3 w-3" />
                                {t('admin.approveUser')}
                              </Button>
                            )}
                             <Button 
                                variant={u.status === 'active' ? "destructive" : "success"} 
                                size="xs" 
                                onClick={() => toggleUserActiveStatus(u.id)}
                            >
                                {u.status === 'active' 
                                    ? <PowerOff className="mr-1 h-3 w-3" />
                                    : <Power className="mr-1 h-3 w-3" />
                                }
                                {u.status === 'active' ? t('admin.deactivateUser') : t('admin.reactivateUser')}
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
