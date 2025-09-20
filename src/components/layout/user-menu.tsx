'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/hooks/use-language';
import { useTheme } from '@/components/providers/theme-provider';
import { useDoctors } from '@/hooks/use-doctors';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { AboutDialog } from '@/components/about-dialog';
import { SpecialtySearchDialog } from '@/components/ai/specialty-search-dialog';
import { CitySearchDialog } from '@/components/ai/city-search-dialog';
import { NearbyDoctorsDialog } from '@/components/ai/nearby-doctors-dialog';
import { ChatDialog } from '@/components/ai/chat-dialog';
import { exportToExcel } from '@/lib/excel';
import { useToast } from '@/hooks/use-toast';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

export function UserMenu() {
  const { user, logout } = useAuth();
  const { lang, setLang, t, dir } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { doctors, resetAllReferrals, uncheckAllPartners, importDoctors } = useDoctors();
  const { toast } = useToast();

  const [isSheetOpen, setSheetOpen] = useState(false);
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
  
  const closeSheet = () => setSheetOpen(false);

  return (
    <>
      <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <CircleUser className="h-5 w-5" />
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side={dir === 'rtl' ? 'left' : 'right'} className="flex flex-col p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{t('userMenu.greeting')},</p>
                <p className="text-xs leading-none text-muted-foreground">{user.username}</p>
              </div>
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-grow">
            <div className="p-4 space-y-4">

              {/* Language */}
              <div className="space-y-2">
                <Label><Languages className="inline-block mr-2 h-4 w-4" />{t('userMenu.changeLanguage')}</Label>
                <RadioGroup value={lang} onValueChange={(value) => setLang(value as 'en' | 'ar')} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="en" id="lang-en" />
                    <Label htmlFor="lang-en">{t('userMenu.english')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ar" id="lang-ar" />
                    <Label htmlFor="lang-ar">{t('userMenu.arabic')}</Label>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              {/* Theme */}
              <div className="space-y-2">
                <Label className="flex items-center">
                  <Sun className="h-4 w-4 mr-2 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 mr-2 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="ml-6">{t('userMenu.toggleTheme')}</span>
                </Label>
                <RadioGroup value={theme} onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="theme-light" />
                    <Label htmlFor="theme-light">{t('userMenu.light')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dark" id="theme-dark" />
                    <Label htmlFor="theme-dark">{t('userMenu.dark')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="system" id="theme-system" />
                    <Label htmlFor="theme-system">{t('userMenu.system')}</Label>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              {/* AI Tools */}
              <div className="space-y-2">
                <Label>{t('userMenu.aiTools')}</Label>
                <Button variant="ghost" className="w-full justify-start" onClick={() => { setSpecialtySearchOpen(true); closeSheet(); }}><Globe className="mr-2 h-4 w-4" /><span>{t('userMenu.searchBySpecialty')}</span></Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => { setCitySearchOpen(true); closeSheet(); }}><Map className="mr-2 h-4 w-4" /><span>{t('userMenu.searchByCity')}</span></Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => { setNearbySearchOpen(true); closeSheet(); }}><BrainCircuit className="mr-2 h-4 w-4" /><span>{t('userMenu.searchNearby')}</span></Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => { setChatOpen(true); closeSheet(); }}><BrainCircuit className="mr-2 h-4 w-4" /><span>{t('userMenu.aiChat')}</span></Button>
              </div>

              <Separator />

              {/* Data Actions */}
              <div className="space-y-2">
                <Label>{t('userMenu.dataActions')}</Label>
                <Button variant="ghost" className="w-full justify-start" onClick={handleSearchOnMap}><Map className="mr-2 h-4 w-4" /><span>{t('userMenu.searchOnMap')}</span></Button>
                <Button variant="ghost" className="w-full justify-start" onClick={handleExport}><FileDown className="mr-2 h-4 w-4" /><span>{t('userMenu.exportToExcel')}</span></Button>
                <Button variant="ghost" className="w-full justify-start" onClick={openImportDialog}><FileUp className="mr-2 h-4 w-4" /><span>{t('userMenu.importFromExcel')}</span></Button>
              </div>

              <Separator />

              {/* Management */}
              <div className="space-y-2">
                <Label>{t('userMenu.management')}</Label>
                <ConfirmationDialog
                    title={t('dialogs.resetReferralsTitle')}
                    description={t('dialogs.resetReferralsDesc')}
                    onConfirm={() => { resetAllReferrals(); closeSheet(); }}
                    trigger={<Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive"><RotateCcw className="mr-2 h-4 w-4" /><span>{t('userMenu.resetAllReferrals')}</span></Button>}
                />
                <ConfirmationDialog
                    title={t('dialogs.uncheckPartnersTitle')}
                    description={t('dialogs.uncheckPartnersDesc')}
                    onConfirm={() => { uncheckAllPartners(); closeSheet(); }}
                    trigger={<Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive"><StarOff className="mr-2 h-4 w-4" /><span>{t('userMenu.uncheckAllPartners')}</span></Button>}
                />
              </div>

              <Separator />

            </div>
          </ScrollArea>
          <div className="p-4 mt-auto border-t space-y-2">
             <Button variant="ghost" className="w-full justify-start" onClick={() => { setAboutOpen(true); closeSheet(); }}><Info className="mr-2 h-4 w-4" /><span>{t('userMenu.about')}</span></Button>
             <Button variant="ghost" className="w-full justify-start" onClick={logout}><LogOut className="mr-2 h-4 w-4" /><span>{t('auth.logout')}</span></Button>
          </div>
        </SheetContent>
      </Sheet>

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
