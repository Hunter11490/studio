'use client';

import Link from 'next/link';
import {
  HeartPulse,
  Stethoscope,
  Baby,
  Brain,
  Bone,
  Eye,
  Cross,
  FlaskConical,
  PersonStanding,
  Scissors,
  Quote,
  Droplets,
  Languages,
  Palette,
  Laptop,
  User,
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

const departments = [
  {
    name: 'Reception',
    name_ar: 'الاستعلامات',
    description: 'Patient registration and routing.',
    description_ar: 'تسجيل المرضى وتوجيههم.',
    icon: PersonStanding,
    href: '/dashboard/reception',
  },
  {
    name: 'Oncology',
    name_ar: 'قسم الأورام',
    description: 'Manage doctor directory and referrals.',
    description_ar: 'إدارة دليل الأطباء والإحالات.',
    icon: Quote,
    href: '/dashboard/oncology',
  },
  {
    name: 'Cardiology',
    name_ar: 'قسم القلبية',
    description: 'Heart and blood vessel diseases.',
    description_ar: 'أمراض القلب والأوعية الدموية.',
    icon: HeartPulse,
    href: '/dashboard/cardiology',
  },
  {
    name: 'Pediatrics',
    name_ar: 'قسم الأطفال',
    description: 'Infants, children, and adolescents care.',
    description_ar: 'رعاية الرضع والأطفال والمراهقين.',
    icon: Baby,
    href: '/dashboard/pediatrics',
  },
  {
    name: 'Neurology',
    name_ar: 'قسم الأعصاب',
    description: 'Nervous system disorders.',
    description_ar: 'اضطرابات الجهاز العصبي.',
    icon: Brain,
    href: '#',
  },
  {
    name: 'Orthopedics',
    name_ar: 'قسم العظام',
    description: 'Musculoskeletal system issues.',
    description_ar: 'مشاكل الجهاز العضلي الهيكلي.',
    icon: Bone,
    href: '#',
  },
   {
    name: 'General Surgery',
    name_ar: 'قسم الجراحة العامة',
    description: 'Wide range of surgical procedures.',
    description_ar: 'مجموعة واسعة من الإجراءات الجراحية.',
    icon: Scissors,
    href: '/dashboard/surgery',
  },
  {
    name: 'Ophthalmology',
    name_ar: 'قسم العيون',
    description: 'Eye diseases and surgery.',
    description_ar: 'أمراض العيون وجراحتها.',
    icon: Eye,
    href: '#',
  },
   {
    name: 'Blood Bank',
    name_ar: 'مصرف الدم',
    icon: Droplets,
    href: '/dashboard/blood-bank',
  },
  {
    name: 'Emergency',
    name_ar: 'قسم الطوارئ',
    description: 'Immediate medical care.',
    description_ar: 'الرعاية الطبية الفورية.',
    icon: Cross,
    href: '#',
  },
  {
    name: 'Laboratory',
    name_ar: 'قسم المختبر',
    description: 'Medical tests and analysis.',
    description_ar: 'الفحوصات والتحاليل الطبية.',
    icon: FlaskConical,
    href: '#',
  },
];

export default function HospitalDashboardPage() {
  const { lang, setLang, t } = useLanguage();
  const { user, updateUser, users } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const currentUser = users.find(u => u.id === user?.id);
  const [showWelcome, setShowWelcome] = useState(currentUser?.isFirstLogin !== false && currentUser?.role !== 'admin');

  const handleWelcomeClose = () => {
    if (user) {
      updateUser(user.id, { isFirstLogin: false });
    }
    setShowWelcome(false);
  };
  
  const getDepartmentNode = (dept: (typeof departments)[0]) => {
     const isClickable = dept.href !== '#';
     const content = (
        <Card className={`flex flex-col justify-center items-center p-2 aspect-square text-center relative overflow-hidden transition-transform duration-300 ${isClickable ? 'hover:scale-105 hover:shadow-primary/20' : 'opacity-50 cursor-not-allowed'}`}>
            <dept.icon className="h-5 w-5 mb-1 text-primary" />
            <CardTitle className="text-xs font-semibold tracking-tight leading-tight">{lang === 'ar' ? dept.name_ar : dept.name}</CardTitle>
            <StethoscopeLogo className="absolute -right-4 -bottom-4 h-10 w-10 text-primary/5 opacity-50" />
        </Card>
     )

    return isClickable ? <Link href={dept.href} key={dept.name}>{content}</Link> : <div key={dept.name}>{content}</div>;
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

       <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2 p-4">
        {departments.map(getDepartmentNode)}
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
