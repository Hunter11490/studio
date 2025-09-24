'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';
import { Loader2, KeyRound, User } from 'lucide-react';
import { AuthLoader } from '@/components/auth-loader';
import { UserStatus } from '@/types';

const formSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const router = useRouter();
  const { user, users, login, isLoading } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    // If user is already logged in, redirect to dashboard.
    if (!isLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, router, isLoading]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const success = login(values.username, values.password);
    if (success) {
      const loggedInUser = users.find(u => u.username === values.username);
      if (loggedInUser?.status === 'active') {
        toast({
          title: t('auth.login'),
          description: `${t('userMenu.greeting')} ${values.username}`,
        });
        router.replace('/dashboard');
      } else if (loggedInUser?.status === 'pending') {
        router.replace('/dashboard');
      } else {
         toast({
          title: t('admin.status.deactivated'),
          description: t('admin.bannedDesc'),
          variant: 'destructive',
        });
        form.reset();
      }
    } else {
      toast({
        title: 'Login Failed',
        description: 'Invalid username or password.',
        variant: 'destructive',
      });
      form.reset();
    }
  }

  // Show a loader while checking auth status, or if we're about to redirect.
  if (isLoading || user) {
    return <AuthLoader />;
  }

  return (
    <div className="flex flex-col gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
            <Logo className="h-16 w-16 text-primary mb-2 lg:hidden" />
            <h1 className="text-3xl font-semibold">{t('auth.login')}</h1>
            <p className="text-muted-foreground">{t('auth.loginCta')}</p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.username')}</FormLabel>
                   <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <FormControl>
                            <Input placeholder="user123" {...field} className="pl-10" />
                        </FormControl>
                   </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.password')}</FormLabel>
                   <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} className="pl-10" />
                        </FormControl>
                    </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('auth.login')}
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          {t('auth.noAccount')}{' '}
          <Link href="/signup" className="underline font-medium text-primary">
            {t('auth.signup')}
          </Link>
        </div>
    </div>
  );
}
