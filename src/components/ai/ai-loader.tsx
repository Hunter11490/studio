import { MedicalLoader } from '../medical-loader';

export function AILoader({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 my-8 text-muted-foreground">
      <MedicalLoader />
      {text && <p className="text-sm">{text}</p>}
    </div>
  );
}
