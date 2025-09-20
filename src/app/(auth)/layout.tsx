import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const bgImage = PlaceHolderImages.find(img => img.id === 'auth-background');

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center bg-background p-4">
      {bgImage && (
        <Image
          src={bgImage.imageUrl}
          alt={bgImage.description}
          data-ai-hint={bgImage.imageHint}
          fill
          className="object-cover opacity-10 dark:opacity-5"
          priority
        />
      )}
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </main>
  );
}
