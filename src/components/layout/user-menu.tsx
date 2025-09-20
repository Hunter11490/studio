'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  SlidersHorizontal
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/hooks/use-language';
import { useTheme } from '@/components/providers/theme-provider';
import { useDoctors } from '@/hooks/use-doctors';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { AboutDialog } from '@/components/about-dialog';
import { SpecialtySearchDialog } from '@/components/ai/specialty-search-dialog';
import { CitySearchDialog } from '@/components/ai/city-search-dialog';
import { NearbyDoctorsDialog } from '@/components/ai/nearby-doctors-dialog';
import { ChatDialog } from '@/components/ai/chat-dialog';
import { exportToExcel } from '@/lib/excel';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';

export function UserMenu() {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { doctors, resetAllReferrals, uncheckAllPartners, importDoctors } = useDoctors();
  const { toast } = useToast();

  const [isAboutOpen, setAboutOpen] = useState(false);
  const [isSpecialtySearchOpen, setSpecialtySearchOpen] = useState(false);
  const [isCitySearchOpen, setCitySearchOpen] = useState(false);
  const [isNearbySearchOpen, setNearbySearchOpen] = useState(false);
  const [isChatOpen, setChatOpen] = useState(false);

  const handleExport = () => {
    try {
      exportToExcel(doctors, `Iraqi_Doctors_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast({ title: t('toasts.exportSuccess') });
    } catch (error) {
      console.error(error);
      toast({ title: t('toasts.exportError'), variant: 'destructive' });
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    toast({ title: "Import functionality is under development." });
    event.target.value = ''; // Reset file input
  };

  const openImportDialog = () => {
    document.getElementById('import-excel-input')?.click();
  };

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

  if (!user) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <CircleUser className="h-5 w-5" />
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{t('userMenu.greeting')},</p>
              <p className="text-xs leading-none text-muted-foreground">{user.username}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <ScrollArea className="h-auto max-h-[60vh] pr-3">
            <div className="space-y-1 pl-1">
              {user.role === 'admin' && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <Shield className="mr-2 h-4 w-4" />
                      <span>{t('header.adminDashboard')}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuGroup>
                <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none">
                  <div className="space-y-2">
                    <Label><Languages className="inline-block mr-2 h-4 w-4" />{t('userMenu.changeLanguage')}</Label>
                    <RadioGroup value={lang} onValueChange={(value) => setLang(value as 'en' | 'ar')} className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="en" id="lang-en-dd" />
                        <Label htmlFor="lang-en-dd">{t('userMenu.english')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ar" id="lang-ar-dd" />
                        <Label htmlFor="lang-ar-dd">{t('userMenu.arabic')}</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                 <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none">
                  <div className="space-y-2">
                    <Label className="flex items-center">
                      <div className="relative mr-2 h-[1.2rem] w-[1.2rem]">
                        <Sun className="h-full w-full rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute top-0 left-0 h-full w-full rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                      </div>
                      <span>{t('userMenu.toggleTheme')}</span>
                    </Label>
                     <RadioGroup value={theme} onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')} className="flex gap-4">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="light" id="theme-light-dd" />
                            <Label htmlFor="theme-light-dd">{t('userMenu.light')}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="dark" id="theme-dark-dd" />
                            <Label htmlFor="theme-dark-dd">{t('userMenu.dark')}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="system" id="theme-system-dd" />
                            <Label htmlFor="theme-system-dd">{t('userMenu.system')}</Label>
                        </div>
                    </RadioGroup>
                  </div>
                 </div>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>{t('userMenu.aiTools')}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setSpecialtySearchOpen(true)}><Globe className="mr-2 h-4 w-4" /><span>{t('userMenu.searchBySpecialty')}</span></DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCitySearchOpen(true)}><Map className="mr-2 h-4 w-4" /><span>{t('userMenu.searchByCity')}</span></DropdownMenuItem>
                <DropdownMenuItem onClick={() => setNearbySearchOpen(true)}><BrainCircuit className="mr-2 h-4 w-4" /><span>{t('userMenu.searchNearby')}</span></DropdownMenuItem>
                <DropdownMenuItem onClick={() => setChatOpen(true)}><BrainCircuit className="mr-2 h-4 w-4" /><span>{t('userMenu.aiChat')}</span></DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>{t('userMenu.dataActions')}</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleSearchOnMap}><Map className="mr-2 h-4 w-4" /><span>{t('userMenu.searchOnMap')}</span></DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport}><FileDown className="mr-2 h-4 w-4" /><span>{t('userMenu.exportToExcel')}</span></DropdownMenuItem>
                <DropdownMenuItem onClick={openImportDialog}><FileUp className="mr-2 h-4 w-4" /><span>{t('userMenu.importFromExcel')}</span></DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>{t('userMenu.management')}</DropdownMenuLabel>
                <ConfirmationDialog
                    title={t('dialogs.resetReferralsTitle')}
                    description={t('dialogs.resetReferralsDesc')}
                    onConfirm={resetAllReferrals}
                    trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive hover:!text-destructive focus:!text-destructive"><RotateCcw className="mr-2 h-4 w-4" /><span>{t('userMenu.resetAllReferrals')}</span></DropdownMenuItem>}
                />
                <ConfirmationDialog
                    title={t('dialogs.uncheckPartnersTitle')}
                    description={t('dialogs.uncheckPartnersDesc')}
                    onConfirm={uncheckAllPartners}
                    trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive hover:!text-destructive focus:!text-destructive"><StarOff className="mr-2 h-4 w-4" /><span>{t('userMenu.uncheckAllPartners')}</span></DropdownMenuItem>}
                />
              </DropdownMenuGroup>
            </div>
          </ScrollArea>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setAboutOpen(true)}><Info className="mr-2 h-4 w-4" /><span>{t('userMenu.about')}</span></DropdownMenuItem>
          <DropdownMenuItem onClick={logout}><LogOut className="mr-2 h-4 w-4" /><span>{t('auth.logout')}</span></DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Hidden file input for import */}
      <input
        type="file"
        id="import-excel-input"
        className="hidden"
        accept=".xlsx, .xls"
        onChange={handleImport}
      />
      
      {/* Dialogs */}
      <AboutDialog open={isAboutOpen} onOpenChange={setAboutOpen} />
      <SpecialtySearchDialog open={isSpecialtySearchOpen} onOpenChange={setSpecialtySearchOpen} />
      <CitySearchDialog open={isCitySearchOpen} onOpenChange={setCitySearchOpen} />
      <NearbyDoctorsDialog open={isNearbySearchOpen} onOpenChange={setNearbySearchOpen} />
      <ChatDialog open={isChatOpen} onOpenChange={setChatOpen} />
    </>
  );
}
