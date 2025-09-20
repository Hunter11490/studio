'use client';

import { useState } from 'react';
import {
  BrainCircuit,
  ChevronDown,
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
  Info
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/hooks/use-language';
import { useTheme } from '@/components/providers/theme-provider';
import { useDoctors } from '@/hooks/use-doctors';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { AboutDialog } from '@/components/about-dialog';
import { SpecialtySearchDialog } from '@/components/ai/specialty-search-dialog';
import { CitySearchDialog } from '@/components/ai/city-search-dialog';
import { NearbyDoctorsDialog } from '@/components/ai/nearby-doctors-dialog';
import { ChatDialog } from '@/components/ai/chat-dialog';
import { exportToExcel } from '@/lib/excel';
import { useToast } from '@/hooks/use-toast';

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
    // This is a placeholder for the actual import logic, which would be more complex
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
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{t('userMenu.greeting')},</p>
              <p className="text-xs leading-none text-muted-foreground">{user.username}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Languages className="mr-2 h-4 w-4" />
              <span>{t('userMenu.changeLanguage')}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup value={lang} onValueChange={(value) => setLang(value as 'en' | 'ar')}>
                  <DropdownMenuRadioItem value="en">{t('userMenu.english')}</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="ar">{t('userMenu.arabic')}</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute mr-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span>{t('userMenu.toggleTheme')}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}>
                  <DropdownMenuRadioItem value="light">{t('userMenu.light')}</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark">{t('userMenu.dark')}</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="system">{t('userMenu.system')}</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          <DropdownMenuLabel>{t('userMenu.aiTools')}</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => setSpecialtySearchOpen(true)}>
            <Globe className="mr-2 h-4 w-4" />
            <span>{t('userMenu.searchBySpecialty')}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setCitySearchOpen(true)}>
            <Map className="mr-2 h-4 w-4" />
            <span>{t('userMenu.searchByCity')}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setNearbySearchOpen(true)}>
            <BrainCircuit className="mr-2 h-4 w-4" />
            <span>{t('userMenu.searchNearby')}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setChatOpen(true)}>
            <BrainCircuit className="mr-2 h-4 w-4" />
            <span>{t('userMenu.aiChat')}</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          
          <DropdownMenuLabel>{t('userMenu.dataActions')}</DropdownMenuLabel>
          <DropdownMenuItem onSelect={handleSearchOnMap}>
            <Map className="mr-2 h-4 w-4" />
            <span>{t('userMenu.searchOnMap')}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleExport}>
            <FileDown className="mr-2 h-4 w-4" />
            <span>{t('userMenu.exportToExcel')}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={openImportDialog}>
            <FileUp className="mr-2 h-4 w-4" />
            <span>{t('userMenu.importFromExcel')}</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuLabel>{t('userMenu.management')}</DropdownMenuLabel>
          <ConfirmationDialog
            title={t('dialogs.resetReferralsTitle')}
            description={t('dialogs.resetReferralsDesc')}
            onConfirm={resetAllReferrals}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <RotateCcw className="mr-2 h-4 w-4" />
                <span>{t('userMenu.resetAllReferrals')}</span>
              </DropdownMenuItem>
            }
          />
          <ConfirmationDialog
            title={t('dialogs.uncheckPartnersTitle')}
            description={t('dialogs.uncheckPartnersDesc')}
            onConfirm={uncheckAllPartners}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <StarOff className="mr-2 h-4 w-4" />
                <span>{t('userMenu.uncheckAllPartners')}</span>
              </DropdownMenuItem>
            }
          />

          <DropdownMenuSeparator />
          
          <DropdownMenuItem onSelect={() => setAboutOpen(true)}>
            <Info className="mr-2 h-4 w-4" />
            <span>{t('userMenu.about')}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>{t('auth.logout')}</span>
          </DropdownMenuItem>
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
