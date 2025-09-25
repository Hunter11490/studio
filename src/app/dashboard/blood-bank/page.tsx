'use client';

import { useMemo, useState } from 'react';
import { useDoctors } from '@/hooks/use-doctors';
import { useLanguage } from '@/hooks/use-language';
import { Frown, UserSearch, Droplets, Plus, Minus, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

const bloodTypes: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Mock data for blood bank inventory
const initialInventory: Record<BloodType, number> = {
    'A+': 10, 'A-': 5, 'B+': 8, 'B-': 3, 'AB+': 2, 'AB-': 1, 'O+': 15, 'O-': 7
};

// Mock data for donors
const mockDonors = [
    { id: 'donor1', name: 'Ali Hassan', bloodType: 'A+' as BloodType, lastDonation: '2024-03-15' },
    { id: 'donor2', name: 'Fatima Ahmed', bloodType: 'O-' as BloodType, lastDonation: '2024-04-01' },
    { id: 'donor3', name: 'Yusuf Khalid', bloodType: 'B+' as BloodType, lastDonation: '2024-02-20' },
];

function getBloodTypeColor(type: BloodType) {
    if (type.includes('O')) return 'bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 border-sky-300';
    if (type.includes('A')) return 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-300';
    if (type.includes('B')) return 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 border-yellow-300';
    if (type.includes('AB')) return 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-purple-300';
    return '';
}

export default function BloodBankPage() {
    const { searchTerm } = useDoctors();
    const { t } = useLanguage();
    const [inventory, setInventory] = useState(initialInventory);

    const handleInventoryChange = (type: BloodType, amount: number) => {
        setInventory(prev => ({
            ...prev,
            [type]: Math.max(0, prev[type] + amount)
        }));
    };

    const filteredDonors = useMemo(() => {
        return mockDonors.filter(donor =>
            !searchTerm || donor.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    return (
        <>
            <Header />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="lg:col-span-3">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Droplets className="text-destructive" />{t('departments.bloodBank')} - Inventory</CardTitle>
                            <CardDescription>Current available blood units.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                            {bloodTypes.map(type => (
                                <div key={type} className={cn("p-3 rounded-lg border text-center flex flex-col items-center gap-2", getBloodTypeColor(type))}>
                                    <span className="font-bold text-lg">{type}</span>
                                    <span className="text-2xl font-mono">{inventory[type]}</span>
                                    <div className="flex gap-1">
                                        <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full" onClick={() => handleInventoryChange(type, -1)}><Minus className="h-4 w-4" /></Button>
                                        <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full" onClick={() => handleInventoryChange(type, 1)}><Plus className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-3">
                         <CardHeader>
                            <CardTitle className="flex items-center gap-2"><User className="text-primary" />Donors List</CardTitle>
                            <CardDescription>List of registered blood donors.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Blood Type</TableHead>
                                        <TableHead>Last Donation</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredDonors.map(donor => (
                                        <TableRow key={donor.id}>
                                            <TableCell className="font-medium">{donor.name}</TableCell>
                                            <TableCell>
                                                <Badge className={cn("font-mono", getBloodTypeColor(donor.bloodType))}>
                                                    {donor.bloodType}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{donor.lastDonation}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </>
    );
}
