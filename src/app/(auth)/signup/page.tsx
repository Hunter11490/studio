'use client';

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

const formSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phoneNumber: z.string().optional(),
});

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
      phoneNumber: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const success = signup(values.username, values.password, values.phoneNumber);
    if (success) {
      toast({
        title: t('auth.signupSuccessTitle'),
        description: t('auth.signupSuccessDesc'),
      });
      router.replace('/login');
    } else {
      toast({
        title: t('auth.signupFailedTitle'),
        description: t('auth.signupFailedDesc'),
        variant: 'destructive',
      });
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="items-center text-center">
        <Logo className="h-16 w-16 text-primary mb-2" />
        <CardTitle className="font-headline text-3xl">{t('auth.signup')}</CardTitle>
        <CardDescription>{t('auth.signupCta')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.username')}</FormLabel>
                  <FormControl>
                    <Input placeholder="newuser" {...field} />
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
             <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.phoneNumber')}</FormLabel>
                  <FormControl>
                    <Input placeholder="07..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {t('auth.signup')}
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          {t('auth.haveAccount')}{' '}
          <Link href="/login" className="underline">
            {t('auth.login')}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
