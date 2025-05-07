
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Role } from '@/types/user';
import { LogIn, UserCircle, Loader2 } from 'lucide-react';
import { useEffect } from 'react';

const loginFormSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters.' }),
  role: z.nativeEnum(Role, { errorMap: () => ({ message: "Please select a role."}) }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
  const { login, authState } = useAuth();
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: '',
      role: undefined, 
    },
  });

 useEffect(() => {
    if (authState.isAuthenticated && !authState.loading) {
      router.push('/profile');
    }
  }, [authState, router]);

  if (authState.loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading session...</p>
      </div>
    );
  }
  
  if (authState.isAuthenticated) {
    // This will be brief as useEffect will redirect.
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  function onSubmit(values: LoginFormValues) {
    login(values.username, values.role);
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary/30 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center pt-8 pb-6">
          <div className="mx-auto bg-primary text-primary-foreground rounded-full p-4 w-fit mb-6 shadow-md">
            <UserCircle className="h-12 w-12" />
          </div>
          <CardTitle className="text-3xl font-bold text-foreground">Welcome Back</CardTitle>
          <CardDescription className="text-md text-muted-foreground pt-1">Please enter your details to log in.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 px-6 pb-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your username" {...field} className="h-11 text-base" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Select Role (Demo)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11 text-base">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(Role).map((roleValue) => (
                          <SelectItem key={roleValue} value={roleValue} className="text-base py-2.5">
                            {roleValue}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="p-6 pt-2">
              <Button type="submit" className="w-full h-12 text-base" size="lg">
                <LogIn className="mr-2 h-5 w-5" /> Login
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
