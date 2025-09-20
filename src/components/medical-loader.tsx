import { cn } from '@/lib/utils';
import './medical-loader.css';

export function MedicalLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center w-full", className)}>
      <div className="medical-loader-container">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 20" className="w-48 h-auto">
          <path 
            className="medical-loader-path"
            fill="none" 
            stroke="hsl(var(--primary))" 
            strokeWidth="2" 
            d="M0,10 h20 l5,-7 l5,14 l10,-12 l5,5 h95"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
