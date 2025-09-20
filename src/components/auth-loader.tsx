import { MedicalLoader } from '@/components/medical-loader';
import { Logo } from '@/components/logo';

export function AuthLoader() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-8 bg-background">
      <Logo className="h-24 w-24 text-primary" />
      <MedicalLoader />
    </div>
  );
}
