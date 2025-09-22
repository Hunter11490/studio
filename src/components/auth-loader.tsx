import { MedicalLoader } from '@/components/medical-loader';
import { Logo } from '@/components/logo';

export function AuthLoader() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-8 bg-background">
        <div className="flex flex-col items-center gap-4">
            <Logo className="h-24 w-24 text-primary" />
            <div className="flex flex-col items-center">
                <h1 className="text-3xl font-semibold tracking-tight text-primary animate-glow">روح</h1>
                <p className="text-sm text-muted-foreground">لادارة المراكز والمستشفيات</p>
            </div>
        </div>
      <MedicalLoader />
    </div>
  );
}
