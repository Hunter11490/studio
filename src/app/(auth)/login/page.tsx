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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/logo';
import { Loader2 } from 'lucide-react';
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
        router.replace('/dashboard');
      } else if (loggedInUser?.status === 'pending') {
        router.replace('/dashboard'); // Dashboard layout will handle the redirect
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
    <Card className="w-full">
      <CardHeader className="items-center text-center">
        <Logo className="h-16 w-16 text-primary mb-2" />
        <CardTitle className="font-headline text-3xl">{t('auth.login')}</CardTitle>
        <CardDescription>{t('auth.loginCta')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.username')}</FormLabel>
                  <FormControl>
                    <Input placeholder="user123" {...field} />
                  </FormControl>
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
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
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
          <Link href="/signup" className="underline">
            {t('auth.signup')}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
