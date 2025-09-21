'use client';

import { ThemeProvider } from './theme-provider';
import { LanguageProvider } from './language-provider';
import { AuthProvider } from './auth-provider';
import { DoctorProvider } from './doctor-provider';
import { OfflineProvider } from './offline-provider';

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="system" storageKey="iraqi-doctors-theme">
      <LanguageProvider>
        <OfflineProvider>
          <AuthProvider>
            <DoctorProvider>
              {children}
            </DoctorProvider>
          </AuthProvider>
        </OfflineProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
