import { BrainCircuit } from 'lucide-react';

export function AILoader({ text = "AI is thinking..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 my-8 text-muted-foreground">
      <BrainCircuit className="h-12 w-12 animate-pulse text-primary" />
      <p className="text-sm">{text}</p>
    </div>
  );
}
