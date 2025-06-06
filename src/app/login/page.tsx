
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
    <div className="flex items-center justify-center min-h-screen bg-secondary/30 p-4">
      <Card className="w-full max-w-md shadow-xl border border-border/50"> {/* Added subtle border */}
        <CardHeader className="text-center pt-8 pb-6">
          <div className="mx-auto bg-primary text-primary-foreground rounded-full p-2.5 w-fit mb-4 shadow-sm"> {/* Adjusted padding */}
            <UserCircle className="h-8 w-8" /> {/* Adjusted size */}
          </div>
          <CardTitle className="text-xl font-semibold text-foreground">Welcome Back</CardTitle> {/* Adjusted size */}
          <CardDescription className="text-xs text-muted-foreground pt-1">Please enter your details to log in.</CardDescription> {/* Adjusted size */}
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4 px-6 pb-5"> {/* Adjusted spacing/padding */}
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Username</FormLabel> {/* Smaller label */}
                    <FormControl>
                      <Input placeholder="Enter your username" {...field} className="h-9 text-sm" /> {/* Adjusted height */}
                    </FormControl>
                    <FormMessage className="text-xs"/> {/* Ensure message size matches */}
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Select Role (Demo)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                         <SelectTrigger className="h-9 text-sm"> {/* Adjusted height */}
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(Role).map((roleValue) => (
                          <SelectItem key={roleValue} value={roleValue} className="text-sm py-1.5"> {/* Adjusted padding */}
                            {roleValue}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs"/>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="p-6 pt-0"> {/* Use CardFooter for actions, ensure consistent padding */}
              <Button type="submit" className="w-full h-10 text-sm font-semibold" size="default"> {/* Adjusted height/size */}
                <LogIn className="mr-1.5 h-4 w-4" /> Login {/* Adjusted icon size */}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
