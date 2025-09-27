'use client';

import { ThemeProvider } from './theme-provider';
import { LanguageProvider } from './language-provider';
import { AuthProvider } from './auth-provider';
import { DoctorProvider } from './doctor-provider';
import { PatientProvider } from './patient-provider';
import { OfflineProvider } from './offline-provider';
import { SimulationProvider } from './simulation-provider';
import { NotificationProvider } from './notification-provider';

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="system" storageKey="iraqi-doctors-theme">
      <LanguageProvider>
        <OfflineProvider>
          <NotificationProvider>
            <AuthProvider>
              <DoctorProvider>
                <PatientProvider>
                    {children}
                </PatientProvider>
              </DoctorProvider>
            </AuthProvider>
          </NotificationProvider>
        </OfflineProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
