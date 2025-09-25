'use client';

import { useMemo } from 'react';
import { usePatients } from '@/hooks/use-patients';
import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { isToday, isYesterday, subDays, startOfDay, endOfDay, format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Activity, ArrowDown, ArrowUp, Users, Building, AlertTriangle } from 'lucide-react';
import { translations } from '@/lib/localization';

function StatCard({ title, value, change, description, icon: Icon }: { title: string; value: string | number; change?: number | null; description?: string; icon: React.ElementType }) {
  const isPositive = change !== undefined && change !== null && change > 0;
  const isNegative = change !== undefined && change !== null && change < 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && change !== null ? (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <span className={isPositive ? "text-success" : isNegative ? "text-destructive" : ""}>
              {isPositive && <ArrowUp className="inline h-4 w-4" />}
              {isNegative && <ArrowDown className="inline h-4 w-4" />}
              {change.toFixed(1)}%
            </span>
            {description}
          </p>
        ) : (
          description && <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}


export function PatientStatsDashboard() {
  const { patients } = usePatients();
  const { t, lang } = useLanguage();

  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    
    const patientsToday = patients.filter(p => isToday(new Date(p.createdAt)));
    const patientsYesterday = patients.filter(p => isYesterday(new Date(p.createdAt)));
    
    const last7DaysStart = startOfDay(subDays(now, 6));
    const patientsLast7Days = patients.filter(p => new Date(p.createdAt) >= last7DaysStart);
    
    const prev7DaysStart = startOfDay(subDays(now, 13));
    const prev7DaysEnd = endOfDay(subDays(now, 7));
    const patientsPrev7Days = patients.filter(p => {
        const d = new Date(p.createdAt);
        return d >= prev7DaysStart && d <= prev7DaysEnd;
    });

    const dailyChange = (patientsYesterday.length > 0)
      ? ((patientsToday.length - patientsYesterday.length) / patientsYesterday.length) * 100
      : (patientsToday.length > 0 ? Infinity : 0);

    const weeklyChange = (patientsPrev7Days.length > 0)
        ? ((patientsLast7Days.length - patientsPrev7Days.length) / patientsPrev7Days.length) * 100
        : (patientsLast7Days.length > 0 ? Infinity : 0);

    const departmentCounts = patientsLast7Days.reduce((acc, p) => {
        acc[p.department] = (acc[p.department] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    const busiestDepartmentEntry = Object.entries(departmentCounts).sort(([, a], [, b]) => b - a)[0];
    const busiestDepartment = busiestDepartmentEntry 
        ? { name: t(`departments.${busiestDepartmentEntry[0]}`), count: busiestDepartmentEntry[1] } 
        : null;

    const dailyTraffic = Array.from({ length: 7 }).map((_, i) => {
        const day = subDays(todayStart, i);
        const dayPatients = patients.filter(p => isSameDay(new Date(p.createdAt), day));
        return {
            name: format(day, 'EEE', { locale: lang === 'ar' ? ar : undefined }),
            total: dayPatients.length
        };
    }).reverse();

    return {
        todayCount: patientsToday.length,
        dailyChange: dailyChange === Infinity ? null : dailyChange,
        weeklyCount: patientsLast7Days.length,
        weeklyChange: weeklyChange === Infinity ? null : weeklyChange,
        busiestDepartment,
        dailyTraffic
    };
  }, [patients, t, lang]);

  const isSameDay = (d1: Date, d2: Date) => {
      return d1.getFullYear() === d2.getFullYear() &&
             d1.getMonth() === d2.getMonth() &&
             d1.getDate() === d2.getDate();
  };

  return (
    <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatCard 
                title={t('reception.title')} 
                value={stats.todayCount} 
                change={stats.dailyChange}
                description={t('admin.stats.vsYesterday')}
                icon={Users}
            />
            <StatCard 
                title={t('admin.stats.weeklyTotal')} 
                value={stats.weeklyCount}
                change={stats.weeklyChange}
                description={t('admin.stats.vsLastWeek')}
                icon={Activity}
            />
            <StatCard
                title={t('admin.stats.busiestDepartment')}
                value={stats.busiestDepartment?.name || t('common.notAvailable')}
                description={stats.busiestDepartment ? `${t('admin.stats.with')} ${stats.busiestDepartment.count} ${t('admin.stats.patients')}` : ''}
                icon={Building}
            />
        </div>
        <Card>
            <CardHeader>
                <CardTitle>{t('admin.stats.weeklyTraffic')}</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                {patients.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={stats.dailyTraffic}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))'
                                }}
                            />
                            <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                                <LabelList dataKey="total" position="top" className="fill-foreground" fontSize={12} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-[350px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                        <AlertTriangle className="w-10 h-10" />
                        <p>{t('admin.stats.noPatientData')}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}

// Add new translations for the stats dashboard
const newEnTranslations = {
    "admin": {
        ...translations.en.admin,
        "stats": {
            "vsYesterday": "vs. yesterday",
            "weeklyTotal": "Weekly Patients (Last 7 Days)",
            "vsLastWeek": "vs. last week",
            "busiestDepartment": "Busiest Department (7 Days)",
            "with": "with",
            "patients": "patients",
            "weeklyTraffic": "Weekly Patient Traffic",
            "noPatientData": "No patient data available to display charts."
        }
    }
};
const newArTranslations = {
    "admin": {
        ...translations.ar.admin,
        "stats": {
            "vsYesterday": "مقارنة بالأمس",
            "weeklyTotal": "مرضى الأسبوع (آخر 7 أيام)",
            "vsLastWeek": "مقارنة بالأسبوع الماضي",
            "busiestDepartment": "القسم الأكثر ازدحاماً (7 أيام)",
            "with": "بواقع",
            "patients": "مريض",
            "weeklyTraffic": "حركة المرضى الأسبوعية",
            "noPatientData": "لا توجد بيانات مرضى لعرض الرسوم البيانية."
        }
    }
};

// This is a bit of a hack to merge translations without causing type errors.
Object.assign(translations.en.admin, newEnTranslations.admin);
Object.assign(translations.ar.admin, newArTranslations.admin);
