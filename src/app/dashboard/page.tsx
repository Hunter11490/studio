'use client';

import Link from 'next/link';
import {
  HeartPulse,
  Stethoscope,
  Baby,
  Brain,
  Bone,
  Eye,
  Heart,
  FlaskConical,
  PersonStanding,
  Scissors,
  Quote,
  Droplets,
  Languages,
  Palette,
  Laptop,
  User,
  Ambulance,
  BedDouble,
  Pill,
  Beaker,
  Scan,
  Users,
  BookUser,
  SprayCan,
  Utensils,
  Calculator,
  Ear,
  Footprints,
  HeartHandshake,
  Shield,
  Loader2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/hooks/use-auth';
import { WelcomeDialog } from '@/components/welcome-dialog';
import { useState } from 'react';
import { StethoscopeLogo } from '@/components/stethoscope-logo';
import { useTheme } from '@/components/providers/theme-provider';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { UserMenu } from '@/components/layout/user-menu';
import { Logo } from '@/components/logo';

const mainDepts = [
  {
    name: 'reception',
    icon: PersonStanding,
    href: '/dashboard/reception',
  },
  {
    name: 'emergency',
    icon: Ambulance,
    href: '#', // TBD
  },
  {
    name: 'icu',
    icon: BedDouble,
    href: '#', // TBD
  },
  {
    name: 'surgicalOperations',
    icon: Scissors,
    href: '/dashboard/surgery',
  },
  {
    name: 'pharmacy',
    icon: Pill,
    href: '/dashboard/pharmacy',
  },
  {
    name: 'laboratories',
    icon: Beaker,
    href: '/dashboard/laboratories',
  },
  {
    name: 'radiology',
    icon: Scan,
    href: '#', // TBD
  },
  {
    name: 'nursing',
    icon: Users,
    href: '/dashboard/representatives',
  },
];

const medicalDepts = [
   { name: 'internalMedicine', icon: Stethoscope, href: '/dashboard/internal-medicine' },
   { name: 'generalSurgery', icon: Scissors, href: '/dashboard/surgery' },
   { name: 'obGyn', icon: HeartHandshake, href: '/dashboard/ob-gyn' },
   { name: 'pediatrics', icon: Baby, href: '/dashboard/pediatrics' },
   { name: 'orthopedics', icon: Bone, href: '/dashboard/orthopedics' },
   { name: 'urology', icon: Footprints, href: '/dashboard/urology' },
   { name: 'ent', icon: Ear, href: '/dashboard/ent' },
   { name: 'ophthalmology', icon: Eye, href: '/dashboard/ophthalmology' },
   { name: 'dermatology', icon: User, href: '/dashboard/dermatology' },
   { name: 'cardiology', icon: HeartPulse, href: '/dashboard/cardiology' },
   { name: 'neurology', icon: Brain, href: '/dashboard/neurology' },
   { name: 'oncology', icon: Quote, href: '/dashboard/oncology' },
   { name: 'nephrology', icon: Droplets, href: '/dashboard/nephrology' },
   { name: 'bloodBank', icon: Heart, href: '/dashboard/blood-bank' },
];

const adminDepts = [
  { name: 'accounts', icon: Calculator, href: '#' }, // TBD
  { name: 'medicalRecords', icon: BookUser, href: '#' }, // TBD
  { name: 'sterilization', icon: SprayCan, href: '#' }, // TBD
  { name: 'services', icon: Utensils, href: '#' }, // TBD
  { name: 'representatives', icon: Users, href: '/dashboard/representatives' },
  { name: 'admin', icon: Shield, href: '/dashboard/admin' },
];


export default function HospitalDashboardPage() {
  const { lang, setLang, t } = useLanguage();
  const { user, updateUser, users } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const currentUser = users.find(u => u.id === user?.id);
  const [showWelcome, setShowWelcome] = useState(currentUser?.isFirstLogin !== false && currentUser?.role !== 'admin');
  const [loadingDept, setLoadingDept] = useState<string | null>(null);

  const handleWelcomeClose = () => {
    if (user) {
      updateUser(user.id, { isFirstLogin: false });
    }
    setShowWelcome(false);
  };
  
  const getDepartmentNode = (dept: {name: string, icon: React.ElementType, href: string}) => {
     // Admin section should only be visible to admin users
     if (dept.name === 'admin' && user?.role !== 'admin') {
      return null;
     }

     const isClickable = dept.href !== '#';
     const isLoading = loadingDept === dept.name;

     const content = (
        <Card 
            onClick={() => isClickable && setLoadingDept(dept.name)}
            className={cn(
                "flex flex-col justify-center items-center p-2 h-24 text-center relative overflow-hidden transition-transform duration-300",
                isClickable ? 'hover:scale-105 hover:shadow-primary/20 cursor-pointer' : 'opacity-50 cursor-not-allowed',
                isLoading && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
            )}
        >
            {isLoading && (
                <div className="absolute inset-0 bg-secondary/80 flex items-center justify-center z-10">
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                </div>
            )}
            <dept.icon className="h-5 w-5 mb-1 text-primary" />
            <CardTitle className="text-xs font-semibold tracking-tight leading-tight">{t(`departments.${dept.name}`)}</CardTitle>
            <StethoscopeLogo className="absolute -right-4 -bottom-4 h-10 w-10 text-primary/5 opacity-50" />
        </Card>
     )

    return isClickable ? <Link href={dept.href} key={dept.name} className="relative">{content}</Link> : <div key={dept.name}>{content}</div>;
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
        <div className="flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
             <div className="flex flex-col items-start">
                <h1 className="text-lg font-semibold tracking-tight whitespace-nowrap text-primary animate-glow">{t('appName')}</h1>
                <p className="text-xs text-muted-foreground">{t('appSubtitle')}</p>
             </div>
        </div>
        <div className="flex items-center gap-4">
            <UserMenu />
        </div>
      </header>

      <div className="p-4">
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {mainDepts.map(getDepartmentNode)}
        </div>
        
        <Separator className="my-4" />
        
        <h2 className="text-sm font-semibold text-muted-foreground px-2 mb-2">{t('departments.medicalSections')}</h2>
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {medicalDepts.map(getDepartmentNode)}
        </div>
        
        <Separator className="my-4" />
        
        <h2 className="text-sm font-semibold text-muted-foreground px-2 mb-2">{t('departments.adminSections')}</h2>
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {adminDepts.map(getDepartmentNode)}
        </div>
      </div>

      <div className="px-4 mt-4 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Languages /> {t('userMenu.changeLanguage')}</CardTitle>
            </CardHeader>
            <CardContent>
                 <RadioGroup value={lang} onValueChange={(value) => setLang(value as 'en' | 'ar')} className="grid grid-cols-2 gap-2">
                  <div>
                    <RadioGroupItem value="en" id="lang-en-dash" className="peer sr-only" />
                    <Label htmlFor="lang-en-dash" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                      {t('userMenu.english')}
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="ar" id="lang-ar-dash" className="peer sr-only" />
                    <Label htmlFor="lang-ar-dash" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                       {t('userMenu.arabic')}
                    </Label>
                  </div>
                </RadioGroup>
            </CardContent>
          </Card>
          <Card>
             <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Palette /> {t('userMenu.toggleTheme')}</CardTitle>
            </CardHeader>
            <CardContent>
                 <div className="grid grid-cols-4 gap-2">
                  {(['light', 'dark', 'pink', 'blue', 'brown', 'emerald', 'amethyst', 'system'] as const).map((themeName) => {
                    const isActive = theme === themeName;
                    return (
                      <Button
                        key={themeName}
                        variant="outline"
                        size="icon"
                        className={cn(
                          'h-12 w-full flex items-center justify-center',
                          isActive && 'border-primary ring-2 ring-primary'
                        )}
                        onClick={() => setTheme(themeName)}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <div className={cn('h-5 w-5 rounded-full flex items-center justify-center', 
                            {
                              'bg-background border': themeName === 'light',
                              'bg-[#090c10] border': themeName === 'dark',
                              'bg-[#fbe8f0] border border-[#f4a8c4]': themeName === 'pink',
                              'bg-[#e8f0f9] border border-[#a8c4f4]': themeName === 'blue',
                              'bg-[#f5f0e8] border border-[#c4a884]': themeName === 'brown',
                              'bg-[#e8f9f0] border border-[#84c4a8]': themeName === 'emerald',
                              'bg-[#f0e8f9] border border-[#c4a8f4]': themeName === 'amethyst',
                              'border': themeName === 'system'
                            }
                          )}>
                            {themeName === 'system' && <Laptop className="h-3 w-3 text-muted-foreground" />}
                          </div>
                          <span className="text-xs capitalize">{t(`userMenu.${themeName}`)}</span>
                        </div>
                      </Button>
                    )
                  })}
                </div>
            </CardContent>
          </Card>
      </div>

      <WelcomeDialog open={showWelcome} onOpenChange={setShowWelcome} onFinished={handleWelcomeClose} />
    </>
  );
}
