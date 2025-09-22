'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BrainCircuit,
  CircleUser,
  Database,
  Globe,
  Languages,
  LogOut,
  Map,
  Moon,
  Sun,
  FileDown,
  FileUp,
  RotateCcw,
  StarOff,
  Info,
  Shield,
  SlidersHorizontal,
  ChevronRight,
  X,
  Users,
  UserSearch,
  Zap,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/hooks/use-language';
import { useTheme } from '@/components/providers/theme-provider';
import { useDoctors } from '@/hooks/use-doctors';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { AboutDialog } from '@/components/about-dialog';
import { ChatDialog } from '@/components/ai/chat-dialog';
import { exportDataFile, importDataFile } from '@/lib/data-import-export';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { AdminPanel } from '../admin/admin-panel';
import { Separator } from '../ui/separator';
import { InternetSearchDialog } from '../ai/internet-search-dialog';
import { IRAQI_GOVERNORATES } from '@/lib/constants';


export function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { lang, setLang, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { doctors, uncheckAllPartners, resetAllReferrals, importDoctors, deleteAllDoctors } = useDoctors();
  const { toast } = useToast();

  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isAboutOpen, setAboutOpen] = useState(false);
  const [isChatOpen, setChatOpen] = useState(false);
  const [isInternetSearchOpen, setInternetSearchOpen] = useState(false);
  const [isQuickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddQuery, setQuickAddQuery] = useState('');
  const [isAdminPanelOpen, setAdminPanelOpen] = useState(false);
  
  useEffect(() => {
    // This effect is to handle the back button for the main user menu sheet
    if (isMenuOpen) {
      window.history.pushState({ sheet: 'userMenu' }, '');
      const handlePopState = (event: PopStateEvent) => {
        if (event.state?.sheet === 'userMenu') {
          setMenuOpen(false);
        }
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [isMenuOpen]);

  const handleMenuOpenChange = (isOpen: boolean) => {
    if (!isOpen && window.history.state?.sheet === 'userMenu') {
      window.history.back();
    }
    setMenuOpen(isOpen);
  };
  
    // This effect handles the back button for the Admin Panel sheet
  useEffect(() => {
    if (isAdminPanelOpen) {
      window.history.pushState({ sheet: 'adminPanel' }, '');
      const handlePopState = (event: PopStateEvent) => {
        if (event.state?.sheet === 'adminPanel') {
          setAdminPanelOpen(false);
        }
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [isAdminPanelOpen]);

  const handleAdminPanelOpenChange = (isOpen: boolean) => {
    if (!isOpen && window.history.state?.sheet === 'adminPanel') {
      window.history.back();
    }
    setAdminPanelOpen(isOpen);
  };

  const handleExport = async () => {
    if (doctors.length === 0) {
        toast({ title: t('toasts.noDataToExport') });
        return;
    }
    try {
      toast({title: t('toasts.exporting'), description: t('toasts.exportingDesc')});
      const fileName = `Spirit_Backup_${new Date().toISOString().split('T')[0]}`;
      exportDataFile(doctors, fileName);
      toast({ title: t('toasts.exportSuccess') });
    } catch (error) {
      console.error(error);
      toast({ title: t('toasts.exportError'), variant: 'destructive' });
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const imported = await importDataFile(file);
        importDoctors(imported);
        toast({ title: t('toasts.importSuccess') });
      } catch (error) {
        console.error(error);
        toast({ title: t('toasts.importError'), variant: 'destructive', description: (error as Error).message });
      } finally {
        // Reset file input to allow re-uploading the same file
        event.target.value = ''; 
      }
    }
  };

  const openImportDialog = () => {
    document.getElementById('import-data-input')?.click();
  };
  
  const handleQuickAdd = () => {
    const baghdadAreas = IRAQI_GOVERNORATES["Baghdad"];
    const randomArea = baghdadAreas[Math.floor(Math.random() * baghdadAreas.length)];
    const query = `أطباء في ${randomArea}`;
    setQuickAddQuery(query);
    setInternetSearchOpen(true);
    handleMenuOpenChange(false);
  };

  const handleLogout = () => {
    logout();
    router.replace('/login');
  }

  const handleSearchOnMap = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        const url = `https://www.google.com/maps/search/doctor/@${latitude},${longitude},15z`;
        window.open(url, '_blank');
      }, () => {
        toast({ title: t('toasts.locationError'), variant: 'destructive' });
      });
    }
  }

  const MenuItem = ({ icon, label, onClick, destructive = false, trigger: TriggerComp }: { icon: React.ReactNode, label: string, onClick?: () => void, destructive?: boolean, trigger?: React.ReactNode }) => {
    const button = (
        <Button
          variant="ghost"
          className={`w-full justify-start h-10 ${destructive ? 'text-destructive hover:text-destructive' : ''}`}
          onClick={() => {
            if (onClick) {
                onClick();
            }
          }}
        >
          {icon}
          <span>{label}</span>
          {!onClick && <ChevronRight className="h-4 w-4 ml-auto" />}
        </Button>
    );

    if (TriggerComp) {
        return React.cloneElement(TriggerComp as React.ReactElement, { children: button });
    }
    
    return button;
  };

  if (!user) return null;

  return (
    <>
      <Sheet open={isMenuOpen} onOpenChange={handleMenuOpenChange}>
        <SheetTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full animate-pulse-glow">
            <CircleUser className="h-5 w-5" />
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-xs p-0 flex flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{t('userMenu.greeting')},</p>
                <p className="text-xs leading-none text-muted-foreground">{user.username}</p>
              </div>
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-grow">
            <div className="p-2 space-y-1">
                {user.role === 'admin' && (
                <>
                  <div className="px-2 py-1.5 text-sm font-semibold">{t('userMenu.management')}</div>
                  <MenuItem icon={<Shield className="mr-2 h-4 w-4" />} label={t('header.adminDashboard')} onClick={() => { setAdminPanelOpen(true); handleMenuOpenChange(false); }} />
                </>
              )}

              <div className="px-2 py-1.5 text-sm font-semibold">{t('userMenu.aiTools')}</div>
              <MenuItem icon={<BrainCircuit className="mr-2 h-4 w-4" />} label={t('userMenu.aiChat')} onClick={() => { setChatOpen(true); handleMenuOpenChange(false); }} />
              <MenuItem icon={<UserSearch className="mr-2 h-4 w-4" />} label={t('userMenu.internetSearch')} onClick={() => { setInternetSearchOpen(true); handleMenuOpenChange(false); }} />
              <MenuItem icon={<Zap className="mr-2 h-4 w-4" />} label={t('userMenu.quickAdd')} onClick={handleQuickAdd} />
              <Separator className="my-2" />

              <div className="px-2 py-1.5 text-sm font-semibold">{t('userMenu.dataActions')}</div>
              <MenuItem icon={<Map className="mr-2 h-4 w-4" />} label={t('userMenu.searchOnMap')} onClick={() => { handleSearchOnMap(); handleMenuOpenChange(false); }} />
              <MenuItem icon={<FileDown className="mr-2 h-4 w-4" />} label={t('userMenu.exportData')} onClick={() => { handleExport(); handleMenuOpenChange(false); }} />
              <MenuItem icon={<FileUp className="mr-2 h-4 w-4" />} label={t('userMenu.importData')} onClick={() => { openImportDialog(); handleMenuOpenChange(false); }} />
              
              <ConfirmationDialog
                  title={t('dialogs.resetReferralsTitle')}
                  description={t('dialogs.resetReferralsDesc')}
                  onConfirm={() => { resetAllReferrals(); handleMenuOpenChange(false); }}
                  trigger={<MenuItem icon={<RotateCcw className="mr-2 h-4 w-4" />} label={t('userMenu.resetAllReferrals')} destructive />}
              />
              <ConfirmationDialog
                  title={t('dialogs.uncheckPartnersTitle')}
                  description={t('dialogs.uncheckPartnersDesc')}
                  onConfirm={() => { uncheckAllPartners(); handleMenuOpenChange(false); }}
                  trigger={<MenuItem icon={<StarOff className="mr-2 h-4 w-4" />} label={t('userMenu.uncheckAllPartners')} destructive />}
              />
              <ConfirmationDialog
                  title={t('dialogs.deleteAllDoctorsTitle')}
                  description={t('dialogs.deleteAllDoctorsDesc')}
                  onConfirm={() => { deleteAllDoctors(); handleMenuOpenChange(false); }}
                  trigger={<MenuItem icon={<Trash2 className="mr-2 h-4 w-4" />} label={t('userMenu.deleteAllDoctors')} destructive />}
              />

              <Separator className="my-2" />

              <div className="p-2 space-y-2">
                <Label><Languages className="inline-block mr-2 h-4 w-4" />{t('userMenu.changeLanguage')}</Label>
                <RadioGroup value={lang} onValueChange={(value) => setLang(value as 'en' | 'ar')} className="grid grid-cols-2 gap-2">
                  <div>
                    <RadioGroupItem value="en" id="lang-en-sheet" className="peer sr-only" />
                    <Label htmlFor="lang-en-sheet" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                      {t('userMenu.english')}
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="ar" id="lang-ar-sheet" className="peer sr-only" />
                    <Label htmlFor="lang-ar-sheet" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                      {t('userMenu.arabic')}
                    </Label>
                  </div>
                </RadioGroup>
              </div>

               <div className="p-2 space-y-2">
                <Label className="flex items-center"><Sun className="h-4 w-4 mr-2 dark:hidden"/><Moon className="h-4 w-4 mr-2 hidden dark:inline-block"/>{t('userMenu.toggleTheme')}</Label>
                 <RadioGroup value={theme} onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')} className="grid grid-cols-3 gap-2">
                    <div>
                      <RadioGroupItem value="light" id="theme-light-sheet" className="peer sr-only" />
                      <Label htmlFor="theme-light-sheet" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">{t('userMenu.light')}</Label>
                    </div>
                     <div>
                      <RadioGroupItem value="dark" id="theme-dark-sheet" className="peer sr-only" />
                      <Label htmlFor="theme-dark-sheet" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">{t('userMenu.dark')}</Label>
                    </div>
                     <div>
                      <RadioGroupItem value="system" id="theme-system-sheet" className="peer sr-only" />
                      <Label htmlFor="theme-system-sheet" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">{t('userMenu.system')}</Label>
                    </div>
                </RadioGroup>
              </div>

            </div>
          </ScrollArea>
           <div className="p-2 border-t mt-auto">
             <MenuItem icon={<Info className="mr-2 h-4 w-4" />} label={t('userMenu.about')} onClick={() => { setAboutOpen(true); handleMenuOpenChange(false); }} />
             <MenuItem icon={<LogOut className="mr-2 h-4 w-4" />} label={t('auth.logout')} onClick={handleLogout} />
           </div>
        </SheetContent>
      </Sheet>

      {/* Hidden file input for import */}
      <input
        type="file"
        id="import-data-input"
        className="hidden"
        accept=".json"
        onChange={handleImport}
      />
      
      {/* Dialogs */}
      <AboutDialog open={isAboutOpen} onOpenChange={setAboutOpen} />
      <ChatDialog open={isChatOpen} onOpenChange={setChatOpen} />
      <InternetSearchDialog 
        open={isInternetSearchOpen} 
        onOpenChange={setInternetSearchOpen} 
        initialSearchQuery={quickAddQuery}
      />
      
      {/* Admin Panel Sheet */}
      {user.role === 'admin' && (
        <Sheet open={isAdminPanelOpen} onOpenChange={handleAdminPanelOpenChange}>
            <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{t('admin.dashboardTitle')}</SheetTitle>
                </SheetHeader>
                <AdminPanel />
            </SheetContent>
        </Sheet>
      )}
    </>
  );
}

    
