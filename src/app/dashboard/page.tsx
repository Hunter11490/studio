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
  Quote
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/hooks/use-auth';
import { WelcomeDialog } from '@/components/welcome-dialog';
import { useState } from 'react';
import { StethoscopeLogo } from '@/components/stethoscope-logo';

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
  const { lang, t } = useLanguage();
  const { user, updateUser, users } = useAuth();
  
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
        <Card className={`relative overflow-hidden transition-transform duration-300 ${isClickable ? 'hover:scale-105 hover:shadow-primary/20' : 'opacity-50 cursor-not-allowed'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2 pb-0">
              <CardTitle className="text-[11px] font-medium">{lang === 'ar' ? dept.name_ar : dept.name}</CardTitle>
              <dept.icon className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-2 pt-1">
              <div className="text-base font-bold font-headline text-primary truncate">{lang === 'ar' ? t(`departments.${dept.name.toLowerCase()}`) : dept.name}</div>
              <p className="text-[10px] text-muted-foreground leading-tight">{lang === 'ar' ? dept.description_ar : dept.description}</p>
            </CardContent>
             <StethoscopeLogo className="absolute -right-2 -bottom-2 h-10 w-10 text-primary/5 opacity-50" />
        </Card>
     )

    return isClickable ? <Link href={dept.href} key={dept.name}>{content}</Link> : <div key={dept.name}>{content}</div>;
  }

  return (
    <>
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold font-headline tracking-tight">{t('appName')}</h1>
        <p className="text-muted-foreground">{t('appSubtitle')}</p>
      </div>
      <div className="grid gap-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {departments.map(getDepartmentNode)}
      </div>
      <WelcomeDialog open={showWelcome} onOpenChange={setShowWelcome} onFinished={handleWelcomeClose} />
    </>
  );
}
