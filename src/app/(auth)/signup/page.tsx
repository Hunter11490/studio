'use client';

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
import { Loader2, User, Mail, KeyRound, Phone } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const formSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phoneNumber: z.string().optional(),
});

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isSignupSuccessful, setSignupSuccessful] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      phoneNumber: '',
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const { error } = await signup(values.email, values.password, {
      data: {
        username: values.username,
        phone_number: values.phoneNumber
      }
    });

    if (error) {
      toast({
        title: t('auth.signupFailedTitle'),
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setSignupSuccessful(true);
      toast({
        title: t('auth.signupSuccessTitle'),
        description: t('auth.signupSuccessDesc'),
      });
      form.reset();
    }
  }

  if (isSignupSuccessful) {
    return (
      <div className="flex flex-col gap-6 text-center">
        <Logo className="h-16 w-16 text-primary mx-auto mb-2" />
        <h1 className="text-2xl font-semibold">{t('auth.signupSuccessTitle')}</h1>
        <Alert>
          <AlertDescription>{t('auth.checkEmail')}</AlertDescription>
        </Alert>
        <Button asChild>
          <Link href="/login">{t('auth.login')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
            <Logo className="h-16 w-16 text-primary mb-2 lg:hidden" />
            <h1 className="text-3xl font-semibold">{t('auth.signup')}</h1>
            <p className="text-muted-foreground">{t('auth.signupCta')}</p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.username')}</FormLabel>
                   <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <FormControl>
                            <Input placeholder="newuser" {...field} className="pl-10" />
                        </FormControl>
                   </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.email')}</FormLabel>
                   <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <FormControl>
                            <Input type="email" placeholder="user@example.com" {...field} className="pl-10" />
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
             <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.phoneNumber')}</FormLabel>
                   <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <FormControl>
                            <Input placeholder="07..." {...field} className="pl-10" />
                        </FormControl>
                   </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('auth.signup')}
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          {t('haveAccount')}{' '}
          <Link href="/login" className="underline font-medium text-primary">
            {t('auth.login')}
          </Link>
        </div>
    </div>
  );
}
