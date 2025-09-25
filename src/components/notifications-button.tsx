'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';
import { useLanguage } from '@/hooks/use-language';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export function NotificationsButton() {
  const { t, lang } = useLanguage();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="relative">
        <Button onClick={() => setIsOpen(true)} variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </div>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="flex flex-col p-0" side={lang === 'ar' ? 'right' : 'left'}>
          <SheetHeader className="p-4 border-b">
            <SheetTitle>{t('notifications.title')}</SheetTitle>
            <SheetDescription>{t('notifications.description')}</SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-grow">
            {notifications.length === 0 ? (
              <div className="text-center text-muted-foreground p-8">{t('notifications.empty')}</div>
            ) : (
              <div className="divide-y">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    className={cn(
                      "p-4 cursor-pointer hover:bg-secondary/50",
                      !n.isRead && "bg-secondary"
                    )}
                    onClick={() => markAsRead(n.id)}
                  >
                    <p className={cn("font-semibold", !n.isRead && "text-primary")}>{n.title}</p>
                    <p className="text-sm text-muted-foreground">{n.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: lang === 'ar' ? ar : undefined })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          {notifications.length > 0 && (
            <SheetFooter className="p-2 border-t flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={markAllAsRead} className="flex-1">
                <CheckCheck className="mr-2 h-4 w-4" />
                {t('notifications.markAllRead')}
              </Button>
              <Button variant="destructive" onClick={clearAll} className="flex-1">
                 <Trash2 className="mr-2 h-4 w-4" />
                 {t('notifications.clearAll')}
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
