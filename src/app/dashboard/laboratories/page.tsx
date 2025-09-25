
'use client';

import { useState, useMemo, useEffect } from 'react';
import { UserMenu } from '@/components/layout/user-menu';
import { Logo } from '@/components/logo';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Beaker, PlusCircle, Trash2, Calculator, X, User, Maximize, Minimize } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { usePatients } from '@/hooks/use-patients';
import { Patient } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from '@/hooks/use-toast';
import { NotificationsButton } from '@/components/notifications-button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type LabTest = {
    id: string;
    name: string;
    price: number;
};

const initialLabTests: LabTest[] = [
    // General Chemistry
    { id: 'cbc', name: 'Complete Blood Count (CBC)', price: 15000 },
    { id: 'bmp', name: 'Basic Metabolic Panel (BMP)', price: 25000 },
    { id: 'cmp', name: 'Comprehensive Metabolic Panel (CMP)', price: 35000 },
    { id: 'lipid', name: 'Lipid Profile', price: 25000 },
    { id: 'lft', name: 'Liver Function Tests (LFT)', price: 30000 },
    { id: 'kft', name: 'Kidney Function Tests (KFT)', price: 20000 },
    { id: 'thyroid_panel', name: 'Thyroid Panel (TSH, T3, T4)', price: 45000 },
    { id: 'tsh', name: 'Thyroid Stimulating Hormone (TSH)', price: 18000 },
    { id: 'blood_sugar', name: 'Blood Sugar (Fasting & PP)', price: 10000 },
    { id: 'hba1c', name: 'HbA1c (Glycated Hemoglobin)', price: 20000 },
    { id: 'urine_analysis', name: 'Urine Analysis', price: 5000 },
    { id: 'serum_electrolytes', name: 'Serum Electrolytes', price: 15000 },
    { id: 'uric_acid', name: 'Uric Acid', price: 10000 },
    { id: 'calcium', name: 'Calcium', price: 10000 },
    { id: 'magnesium', name: 'Magnesium', price: 12000 },
    { id: 'phosphorus', name: 'Phosphorus', price: 12000 },
    { id: 'amylase', name: 'Amylase', price: 18000 },
    { id: 'lipase', name: 'Lipase', price: 20000 },

    // Vitamins & Hormones
    { id: 'vit_d', name: 'Vitamin D, 25-Hydroxy', price: 40000 },
    { id: 'vit_b12', name: 'Vitamin B12', price: 30000 },
    { id: 'folic_acid', name: 'Folic Acid', price: 25000 },
    { id: 'testosterone', name: 'Testosterone, Total', price: 30000 },
    { id: 'estradiol', name: 'Estradiol', price: 30000 },
    { id: 'progesterone', name: 'Progesterone', price: 30000 },
    { id: 'cortisol', name: 'Cortisol', price: 35000 },
    { id: 'prolactin', name: 'Prolactin', price: 25000 },

    // Cardiac Markers
    { id: 'troponin_i', name: 'Troponin-I', price: 45000 },
    { id: 'ck_mb', name: 'Creatine Kinase (CK-MB)', price: 22000 },
    { id: 'bnp', name: 'B-type Natriuretic Peptide (BNP)', price: 60000 },
    { id: 'hs_crp', name: 'High-Sensitivity C-Reactive Protein (hs-CRP)', price: 25000 },

    // Coagulation
    { id: 'pt_inr', name: 'Prothrombin Time (PT/INR)', price: 10000 },
    { id: 'aptt', name: 'Activated Partial Thromboplastin Time (aPTT)', price: 12000 },
    { id: 'd_dimer', name: 'D-Dimer', price: 35000 },
    { id: 'fibrinogen', name: 'Fibrinogen', price: 20000 },

    // Hematology
    { id: 'esr', name: 'Erythrocyte Sedimentation Rate (ESR)', price: 8000 },
    { id: 'ferritin', name: 'Serum Ferritin', price: 25000 },
    { id: 'iron_panel', name: 'Iron and TIBC Panel', price: 30000 },
    { id: 'reticulocyte_count', name: 'Reticulocyte Count', price: 15000 },
    { id: 'blood_group', name: 'Blood Grouping & Rh Factor', price: 5000 },

    // Infectious Diseases & Immunology
    { id: 'crp', name: 'C-Reactive Protein (CRP)', price: 12000 },
    { id: 'aso', name: 'Antistreptolysin O (ASO) Titer', price: 15000 },
    { id: 'rf', name: 'Rheumatoid Factor (RF)', price: 15000 },
    { id: 'ana', name: 'Antinuclear Antibody (ANA)', price: 40000 },
    { id: 'hiv', name: 'HIV I & II Antibody', price: 30000 },
    { id: 'hbsag', name: 'Hepatitis B Surface Antigen (HBsAg)', price: 20000 },
    { id: 'hcv', name: 'Hepatitis C Virus (HCV) Antibody', price: 25000 },
    { id: 'hav', name: 'Hepatitis A Virus (HAV) Antibody', price: 25000 },
    { id: 'vdrl', name: 'VDRL (Syphilis Test)', price: 10000 },
    { id: 'widal', name: 'Widal Test (Typhoid)', price: 15000 },
    { id: 'helicobacter_pylori', name: 'Helicobacter pylori (Stool/Blood)', price: 25000 },
    { id: 'malaria', name: 'Malaria Smear', price: 10000 },
    { id: 'dengue', name: 'Dengue NS1/IgG/IgM', price: 30000 },
    
    // Tumor Markers
    { id: 'psa', name: 'Prostate-Specific Antigen (PSA)', price: 30000 },
    { id: 'cea', name: 'Carcinoembryonic Antigen (CEA)', price: 35000 },
    { id: 'afp', name: 'Alpha-Fetoprotein (AFP)', price: 35000 },
    { id: 'ca125', name: 'Cancer Antigen 125 (CA-125)', price: 40000 },
    { id: 'ca19_9', name: 'Cancer Antigen 19-9 (CA 19-9)', price: 40000 },
    { id: 'ca15_3', name: 'Cancer Antigen 15-3 (CA 15-3)', price: 40000 },
    { id: 'hcg', name: 'Beta-hCG (Tumor Marker)', price: 25000 },

    // Microbiology
    { id: 'urine_culture', name: 'Urine Culture & Sensitivity', price: 30000 },
    { id: 'blood_culture', name: 'Blood Culture & Sensitivity', price: 45000 },
    { id: 'stool_culture', name: 'Stool Culture & Sensitivity', price: 30000 },
    { id: 'throat_swab', name: 'Throat Swab Culture', price: 25000 },
    { id: 'gram_stain', name: 'Gram Stain', price: 10000 },
    { id: 'afb_stain', name: 'AFB Stain (Tuberculosis)', price: 15000 },

    // Other Specialized Tests
    { id: 'g6pd', name: 'G6PD Deficiency Screen', price: 20000 },
    { id: 'serum_protein', name: 'Serum Protein Electrophoresis', price: 35000 },
    { id: 'ldh', name: 'Lactate Dehydrogenase (LDH)', price: 15000 },
    { id: 'alkaline_phosphatase', name: 'Alkaline Phosphatase (ALP)', price: 10000 },
    { id: 'ggt', name: 'Gamma-Glutamyl Transferase (GGT)', price: 12000 },
    { id: 'total_bilirubin', name: 'Bilirubin, Total', price: 10000 },
    { id: 'direct_bilirubin', name: 'Bilirubin, Direct', price: 10000 },
    { id: 'albumin', name: 'Albumin', price: 10000 },
    { id: 'globulin', name: 'Globulin', price: 10000 },
    { id: 'creatinine', name: 'Creatinine, Serum', price: 10000 },
    { id: 'bun', name: 'Blood Urea Nitrogen (BUN)', price: 10000 },
    { id: 'h_pylori_breath', name: 'H. Pylori Urea Breath Test', price: 75000 },
    { id: 'semen_analysis', name: 'Semen Analysis', price: 25000 },
    { id: 'csf_analysis', name: 'Cerebrospinal Fluid (CSF) Analysis', price: 50000 },
    { id: 'pleural_fluid_analysis', name: 'Pleural Fluid Analysis', price: 40000 },
    { id: 'ascitic_fluid_analysis', name: 'Ascitic Fluid Analysis', price: 40000 },
    { id: 'torch_panel', name: 'TORCH Panel (Toxoplasma, Rubella, CMV, HSV)', price: 80000 },
    { id: 'allergy_panel', name: 'Food/Inhalant Allergy Panel', price: 150000 },
    ...Array.from({ length: 30 }, (_, i) => ({
      id: `special_test_${i + 1}`,
      name: `Specialized Genetic Marker ${i + 1}`,
      price: 100000 + Math.floor(Math.random() * 400000)
    }))
];

export default function LaboratoriesPage() {
    const { t } = useLanguage();
    const [tests, setTests] = useLocalStorage<LabTest[]>('lab_tests_list_v2', initialLabTests);
    const { patients, addFinancialRecord } = usePatients();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTests, setSelectedTests] = useState<LabTest[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const { toast } = useToast();
    const [isFullscreen, setIsFullscreen] = useState(false);

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

    const filteredTests = useMemo(() => {
        return tests.filter(test => test.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [tests, searchTerm]);

    const totalCost = useMemo(() => {
        return selectedTests.reduce((total, test) => total + test.price, 0);
    }, [selectedTests]);

    const handleSelectTest = (test: LabTest) => {
        setSelectedTests(prev => [...prev, test]);
    };

    const handleRemoveSelectedTest = (testId: string) => {
        setSelectedTests(prev => prev.filter(t => t.id !== testId));
    };

    const handleConfirmOrder = () => {
        if (!selectedPatientId) {
            toast({ title: t('lab.selectPatientError'), variant: 'destructive'});
            return;
        }
        if (selectedTests.length === 0) {
            toast({ title: t('lab.noTestsSelectedError'), variant: 'destructive'});
            return;
        }

        selectedTests.forEach(test => {
            addFinancialRecord(selectedPatientId, {
                type: 'lab',
                description: `${t('lab.test')}: ${test.name}`,
                amount: test.price,
                date: new Date().toISOString(),
            });
        });
        
        toast({ title: t('lab.orderConfirmed')});
        setSelectedTests([]);
        setSelectedPatientId(null);
    };

    return (
        <div className="flex flex-col h-screen">
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
                <div className="flex items-center gap-2">
                    <Logo className="h-8 w-8 text-primary" />
                </div>
                <div className="flex flex-col items-center">
                    <h1 className="text-lg font-semibold tracking-tight whitespace-nowrap text-primary animate-glow">{t('departments.laboratories')}</h1>
                </div>
                <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleFullscreenToggle}
                          >
                            {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>{isFullscreen ? t('header.exitFullscreen') : t('header.enterFullscreen')}</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <NotificationsButton />
                    <UserMenu />
                </div>
            </header>

            <main className="flex-grow grid md:grid-cols-3 gap-4 p-4 md:p-8">
                <Card className="md:col-span-2 flex flex-col">
                    <CardHeader>
                        <CardTitle>{t('lab.testList')}</CardTitle>
                        <Input
                            placeholder={t('lab.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </CardHeader>
                    <CardContent className="p-0 flex-grow">
                        <ScrollArea className="h-[calc(100vh-250px)]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('lab.testName')}</TableHead>
                                        <TableHead className="text-right">{t('lab.price')}</TableHead>
                                        <TableHead className="w-[100px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTests.map((test) => (
                                        <TableRow key={test.id}>
                                            <TableCell>{test.name}</TableCell>
                                            <TableCell className="text-right" dir="ltr">{test.price.toLocaleString()} {t('lab.iqd')}</TableCell>
                                            <TableCell>
                                                <Button size="sm" variant="outline" onClick={() => handleSelectTest(test)}>
                                                    <PlusCircle className="mr-2 h-4 w-4" />
                                                    {t('common.add')}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>

                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calculator className="h-5 w-5" />
                            {t('lab.costCalculator')}
                        </CardTitle>
                         <Select onValueChange={setSelectedPatientId} value={selectedPatientId || ''}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={t('lab.selectPatient')} />
                            </SelectTrigger>
                            <SelectContent>
                                {patients.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.patientName}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent className="flex-grow p-0">
                         <ScrollArea className="h-[calc(100vh-380px)]">
                            {selectedTests.length === 0 ? (
                                <div className="p-6 text-center text-muted-foreground">{t('lab.noTestsSelected')}</div>
                            ) : (
                                <div className="divide-y">
                                    {selectedTests.map((test, index) => (
                                        <div key={`${test.id}-${index}`} className="flex justify-between items-center p-3">
                                            <span className="text-sm">{test.name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-mono">{test.price.toLocaleString()}</span>
                                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleRemoveSelectedTest(test.id)}>
                                                    <X className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                         </ScrollArea>
                    </CardContent>
                    <CardFooter className="flex-col items-start border-t pt-4 gap-4">
                        <div className="w-full flex justify-between font-bold text-lg">
                            <span>{t('lab.totalCost')}:</span>
                            <span dir="ltr">{totalCost.toLocaleString()} {t('lab.iqd')}</span>
                        </div>
                        <Button className="w-full" onClick={handleConfirmOrder} disabled={!selectedPatientId || selectedTests.length === 0}>
                            {t('lab.confirmOrder')}
                        </Button>
                    </CardFooter>
                </Card>
            </main>
        </div>
    );
}
