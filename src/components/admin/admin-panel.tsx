'use client';

import { useState, useEffect } from 'react';
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
import { PlusCircle, Shield, ShieldOff, Trash2, Pencil, CheckCircle, PowerOff, Power, ToggleRight, ToggleLeft, Copy, Check, Timer, KeyRound } from 'lucide-react';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { AddUserDialog } from '@/components/admin/add-user-dialog';
import { EditUserDialog } from '@/components/admin/edit-user-dialog';
import type { StoredUser, UserStatus } from '@/types';
import { ScrollArea } from '../ui/scroll-area';

const EXPIRY_DURATION_MS = 33 * 24 * 60 * 60 * 1000;

const UserExpiryCountdown = ({ user }: { user: StoredUser }) => {
    const { t } = useLanguage();
    const calculateRemainingTime = () => {
        if (!user.activatedAt) return 0;
        const now = Date.now();
        const expiryTime = user.activatedAt + EXPIRY_DURATION_MS;
        return Math.max(0, expiryTime - now);
    };

    const [remainingTime, setRemainingTime] = useState(calculateRemainingTime);

    useEffect(() => {
        const interval = setInterval(() => {
            setRemainingTime(calculateRemainingTime());
        }, 1000 * 60); // Update every minute is enough
        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user.activatedAt]);

    if (user.role === 'admin' || user.status !== 'active') return null;

    const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remainingTime / (1000 * 60 * 60)) % 24);

    return (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2" dir="ltr">
            <Timer className="h-3 w-3 text-warning" />
            <span className="font-medium text-warning-foreground">
              {t('admin.deactivatesIn', { days, hours })}
            </span>
        </div>
    );
};


const PasswordCountdown = () => {
    const { passTimestamp } = useAuth();
    const {t} = useLanguage();
    const calculateRemainingTime = () => {
        const twentyFourHours = 24 * 60 * 60 * 1000;
        const now = Date.now();
        const nextChangeTime = passTimestamp + twentyFourHours;
        return Math.max(0, nextChangeTime - now);
    };

    const [remainingTime, setRemainingTime] = useState(calculateRemainingTime);

     useEffect(() => {
        const interval = setInterval(() => {
            setRemainingTime(calculateRemainingTime());
        }, 1000);
        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [passTimestamp]);

    const hours = Math.floor((remainingTime / (1000 * 60 * 60)));
    const minutes = Math.floor((remainingTime / 1000 / 60) % 60);
    const seconds = Math.floor((remainingTime / 1000) % 60);

    return (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2" dir="ltr">
            <Timer className="h-3 w-3" />
            <span>{t('admin.sessionEndsIn')}</span>
            <span className="font-mono font-semibold text-foreground tabular-nums">
                {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
        </div>
    );
};


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
                <div className="flex items-center gap-2">
                    <span className="font-medium">Password:</span>
                    <Button size="xs" variant="outline" onClick={handleCopy} className="w-full">
                        {hasCopied ? <Check className="mr-2 h-4 w-4 text-success" /> : <Copy className="mr-2 h-4 w-4" />}
                        {hasCopied ? 'Copied!' : 'Copy Password'}
                    </Button>
                </div>
            </div>
            <PasswordCountdown />
        </div>
    );
};


export function AdminPanel() {
  const { user: currentUser, users, deleteUser, updateUserRole, toggleUserActiveStatus, approveUser, isApprovalSystemEnabled, toggleApprovalSystem, checkAndDeactivateUsers } = useAuth();
  const { t } = useLanguage();
  const [isAddUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<StoredUser | null>(null);
  
  useEffect(() => {
    checkAndDeactivateUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);
  
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
  
  const isAhmed = currentUser?.username === 'Ahmed';

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
                  {currentUser?.username === 'HUNTER' && <DynamicAdminCredentials />}
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
                    {displayUsers.map((u) => {
                      const isTargetAdmin = u.role === 'admin';
                      const canModify = !isAhmed || (isAhmed && !isTargetAdmin);

                      return (
                        <TableRow key={u.id}>
                            <TableCell>
                            <div className="font-medium">{u.username}</div>
                            <div className="text-sm text-muted-foreground" dir="ltr">{u.email}</div>
                            <div className="text-sm text-muted-foreground" dir="ltr">{u.phoneNumber}</div>
                            {u.role === 'user' && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1" dir="ltr">
                                  <KeyRound className="h-3 w-3" />
                                  <span className="font-mono text-xs">{u.pass}</span>
                                </div>
                            )}
                            <div className="my-2 flex flex-wrap gap-1">
                                <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                                    {u.role}
                                </Badge>
                                <Badge variant={getStatusBadgeVariant(u.status)}>
                                    {t(`admin.status.${getStatusTranslationKey(u.status)}`)}
                                </Badge>
                            </div>
                            <UserExpiryCountdown user={u} />
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                {canModify && (
                                  <Button variant="outline" size="xs" onClick={() => handleEditClick(u)}>
                                      <Pencil className="mr-1 h-3 w-3" />
                                      {t('doctorCard.edit')}
                                  </Button>
                                )}
                                {u.status === 'pending' && isApprovalSystemEnabled && canModify && (
                                  <Button variant="success" size="xs" onClick={() => approveUser(u.id)}>
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    {t('admin.approveUser')}
                                  </Button>
                                )}
                                {canModify && (
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
                                )}
                                {currentUser?.username === 'HUNTER' && (
                                  <>
                                    {u.role !== 'admin' ? (
                                        <Button variant="outline" size="xs" onClick={() => updateUserRole(u.id, 'admin')}>
                                            <Shield className="mr-1 h-3 w-3" />
                                            {t('admin.makeAdmin')}
                                        </Button>
                                    ) : (
                                      u.username !== 'Ahmed' && (
                                        <Button variant="secondary" size="xs" onClick={() => updateUserRole(u.id, 'user')}>
                                            <ShieldOff className="mr-1 h-3 w-3" />
                                            {t('admin.removeAdmin')}
                                        </Button>
                                      )
                                    )}
                                  </>
                                )}
                                {canModify && (
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
                                )}
                            </div>
                            </TableCell>
                        </TableRow>
                      );
                    })}
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
