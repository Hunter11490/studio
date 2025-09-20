'use client';

import { Doctor } from '@/types';
import { DoctorCard } from './doctor-card';

type DoctorGridProps = {
  doctors: Doctor[];
};

export function DoctorGrid({ doctors }: DoctorGridProps) {
  return (
    <div className="grid gap-4 md:gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {doctors.map(doctor => (
        <DoctorCard key={doctor.id} doctor={doctor} />
      ))}
    </div>
  );
}
