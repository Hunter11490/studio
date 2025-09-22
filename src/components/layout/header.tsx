'use client';

import { useState } from 'react';
import { PlusCircle, Users, SlidersHorizontal, LayoutGrid, List, ArrowUpDown, Maximize, Minimize, Languages, Loader2 } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { useDoctors } from '@/hooks/use-doctors';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/logo';
import { UserMenu } from './user-menu';
import { DoctorFormDialog } from '@/components/doctor/doctor-form-dialog';
import { PartnerDashboard } from '../doctor/partner-dashboard';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { SortOption } from '@/components/providers/doctor-provider';
import { useToast } from '@/hooks/use-toast';
import { translateText, DoctorInfo } from '@/ai/flows/translation-flow';
import { Doctor } from '@/types';

export function Header() {
  const { lang, t } = useLanguage();
  const { 
    doctors, 
    searchTerm, 
    setSearchTerm, 
    filterPartners, 
    setFilterPartners, 
    viewMode, 
    setViewMode,
    sortOption,
    setSortOption,
    updateMultipleDoctors
  } = useDoctors();
  const { user } = useAuth();
  const [isAddDoctorOpen, setAddDoctorOpen] = useState(false);
  const [isPartnerDashboardOpen, setPartnerDashboardOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const { toast } = useToast();

  const handleFullscreenToggle = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const partnerCount = doctors.filter(d => d.isPartner).length;

  const handleTranslateAll = async () => {
    if (doctors.length === 0) {
      toast({ title: t('toasts.noDoctorsToTranslate') });
      return;
    }
    setIsTranslating(true);
    toast({ title: t('toasts.translatingTitle') });
    try {
        const doctorsToTranslate: DoctorInfo[] = doctors.map(d => ({
            name: d.name,
            specialty: d.specialty,
            clinicAddress: d.clinicAddress
        }));

        const response = await translateText({
            doctors: doctorsToTranslate,
            targetLanguage: 'Arabic',
        });

        const translatedDoctorsMap = new Map(response.doctors.map((d, i) => [i, d]));

        const updatedDoctors: Doctor[] = doctors.map((originalDoctor, index) => {
            const translatedInfo = translatedDoctorsMap.get(index);
            if (translatedInfo) {
                return {
                    ...originalDoctor,
                    name: translatedInfo.name,
                    specialty: translatedInfo.specialty,
                    clinicAddress: translatedInfo.clinicAddress,
                };
            }
            return originalDoctor;
        });

        updateMultipleDoctors(updatedDoctors);
        toast({ title: t('toasts.translationSuccessTitle') });
    } catch (error) {
        console.error("Translation failed:", error);
        toast({ title: t('toasts.translationErrorTitle'), variant: 'destructive' });
    } finally {
        setIsTranslating(false);
    }
  };


  return (
    <>
      <header className="sticky top-0 z-30 flex h-auto flex-col gap-2 border-b bg-background px-4 py-2 md:px-6">
        <div className="flex items-center justify-between gap-4">
          {/* Logo and left-aligned items */}
          <div className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
            <Button size="sm" className="gap-1" onClick={() => setAddDoctorOpen(true)}>
              <PlusCircle className="h-4 w-4" />
              <span className="hidden md:inline">{t('header.addDoctor')}</span>
            </Button>
          </div>

          {/* Centered App Name & Subtitle */}
          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
            <h1 className="text-lg font-semibold tracking-tight whitespace-nowrap text-primary">{t('appName')}</h1>
            <p className="text-[9px] text-muted-foreground whitespace-nowrap -mt-1">{t('appSubtitle')}</p>
          </div>

          {/* User Menu and right-aligned items */}
          <div className="flex items-center gap-4">
            <UserMenu />
          </div>
        </div>

        {/* Search and stats for all screen sizes */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-full lg:w-[320px] relative">
            <Input
              type="search"
              placeholder={t('header.searchPlaceholder')}
              className="w-full rounded-lg bg-secondary pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>{t('header.totalDoctors')}:</span>
              <span className="font-bold text-foreground">{doctors.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{t('header.totalPartners')}:</span>
              <span className="font-bold text-foreground">{partnerCount}</span>
               <Button variant="outline" size="xs" className="gap-1" onClick={() => setPartnerDashboardOpen(true)}>
                <Users className="h-3 w-3" />
              </Button>
            </div>
            
            {/* Controls */}
            <div className="flex items-center gap-1 rounded-md border p-0.5 bg-secondary">
               <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={handleFullscreenToggle}
                      className="h-6 w-6 p-1"
                    >
                      {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>{isFullscreen ? t('header.exitFullscreen') : t('header.enterFullscreen')}</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DropdownMenu>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="xs" className="h-6 w-6 p-1">
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent><p>{t('header.sortBy')}</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <DropdownMenuContent align="end">
                  <DropdownMenuRadioGroup value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                    <DropdownMenuRadioItem value="name">{t('header.sort.name')}</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="createdAt">{t('header.sort.date')}</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="address">{t('header.sort.address')}</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <TooltipProvider>
                 <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={filterPartners ? 'default' : 'ghost'}
                        size="xs"
                        onClick={() => setFilterPartners(!filterPartners)}
                        className="h-6 w-6 p-1"
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>{t('header.filterPartners')}</p></TooltipContent>
                  </Tooltip>
              </TooltipProvider>
              
              <DropdownMenuSeparator orientation="vertical" className="h-5 bg-border mx-1" />

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="xs"
                                onClick={handleTranslateAll}
                                disabled={isTranslating}
                                className="h-6 w-6 p-1"
                            >
                                {isTranslating ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Languages className="h-4 w-4" />
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>{t('header.translateAll')}</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>

              <TooltipProvider>
                  <Tooltip>
                      <TooltipTrigger asChild>
                          <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="xs" className="h-6 w-6 p-1" onClick={() => setViewMode('grid')}>
                              <LayoutGrid className="h-4 w-4" />
                          </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>{t('header.gridView')}</p></TooltipContent>
                  </Tooltip>
                  <Tooltip>
                      <TooltipTrigger asChild>
                            <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="xs" className="h-6 w-6 p-1" onClick={() => setViewMode('list')}>
                              <List className="h-4 w-4" />
                          </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>{t('header.listView')}</p></TooltipContent>
                  </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </header>
      <DoctorFormDialog open={isAddDoctorOpen} onOpenChange={setAddDoctorOpen} />
      <PartnerDashboard open={isPartnerDashboardOpen} onOpenChange={setPartnerDashboardOpen} />
    </>
  );
}
