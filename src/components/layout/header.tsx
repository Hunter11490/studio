'use client';

import { useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
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
import { translateText } from '@/ai/flows/translation-flow';
import type { Doctor, DoctorInfo, ReferralCase } from '@/types';
import { translations } from '@/lib/localization';

function capitalizeFirstLetter(string: string) {
  if (!string) return string;
  // Handle camelCase like 'generalSurgery' -> 'General Surgery'
  const withSpaces = string.replace(/([A-Z])/g, ' $1').trim();
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

export function Header({ onAddDoctor }: { onAddDoctor?: () => void }) {
  const { lang, t } = useLanguage();
  const pathname = usePathname();
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

  const departmentSlug = useMemo(() => {
    const pathParts = pathname.split('/').filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    // Special case for the main dashboard page to show 'Representatives'
    if (lastPart === 'dashboard') return 'representatives';
    return lastPart;
  }, [pathname]);

  const departmentName = useMemo(() => {
    const lowercasedSlug = departmentSlug.toLowerCase();
    const deptKey = Object.keys((translations.en as any).departments).find(key => 
      key.toLowerCase() === lowercasedSlug
    );
    return deptKey ? t(`departments.${deptKey as keyof typeof translations.en.departments}`) : capitalizeFirstLetter(departmentSlug);
  }, [departmentSlug, t]);


  const handleAddClick = () => {
    if (onAddDoctor) {
      onAddDoctor();
    } else {
      setAddDoctorOpen(true);
    }
  };

  const handleFullscreenToggle = async () => {
    if (typeof window !== 'undefined') {
        if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else if (document.exitFullscreen) {
            await document.exitFullscreen();
            setIsFullscreen(false);
        }
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
        const response = await translateText({
            doctors: doctors,
            targetLanguage: 'Arabic',
        });

        const translatedDoctorsMap = new Map<string, DoctorInfo>();
        response.doctors.forEach((translatedDoc, index) => {
            const originalId = doctors[index].id;
            translatedDoctorsMap.set(originalId, translatedDoc);
        });

        const updatedDoctors: Doctor[] = doctors.map(originalDoctor => {
            const translatedInfo = translatedDoctorsMap.get(originalDoctor.id);
            if (translatedInfo) {
                const updatedNotes = originalDoctor.referralNotes?.map((originalNote, noteIndex) => {
                    const translatedNote = translatedInfo.referralNotes?.[noteIndex];
                    return {
                        ...originalNote,
                        patientName: translatedNote?.patientName || originalNote.patientName,
                        testType: translatedNote?.testType || originalNote.testType,
                        chronicDiseases: translatedNote?.chronicDiseases || originalNote.chronicDiseases,
                    };
                });

                return {
                    ...originalDoctor,
                    name: translatedInfo.name,
                    specialty: translatedInfo.specialty,
                    clinicAddress: translatedInfo.clinicAddress,
                    referralNotes: updatedNotes,
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

  const isGenericAddPage = departmentSlug === 'representatives' || departmentSlug === 'admin';


  return (
    <>
      <header className="sticky top-0 z-30 flex h-auto flex-col gap-2 border-b bg-card px-4 py-2 md:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
            <Button size="sm" className="gap-1" onClick={handleAddClick}>
              <PlusCircle className="h-4 w-4" />
              <span className="hidden md:inline">{t('header.addDoctor')}</span>
            </Button>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
            <h1 className="text-lg font-semibold tracking-tight whitespace-nowrap text-primary animate-glow">{departmentName}</h1>
          </div>

          <div className="flex items-center gap-4">
            <UserMenu />
          </div>
        </div>

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
      {isGenericAddPage && <DoctorFormDialog open={isAddDoctorOpen} onOpenChange={setAddDoctorOpen} />}
      <PartnerDashboard open={isPartnerDashboardOpen} onOpenChange={setPartnerDashboardOpen} />
    </>
  );
}
