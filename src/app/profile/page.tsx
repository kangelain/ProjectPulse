
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, UserCircle, ShieldCheck, Briefcase, Loader2, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ProfilePage() {
  const { authState, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authState.loading && !authState.isAuthenticated) {
      router.push('/login');
    }
  }, [authState, router]);

  if (authState.loading || !authState.isAuthenticated || !authState.user) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  const { user } = authState;
  const initial = user.username?.charAt(0).toUpperCase() || '?';
  const userEmail = user.email || `${user.username.toLowerCase().replace(/\s+/g, '.')}@example.com`; // Demo email

  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-2xl mx-auto shadow-2xl">
        <CardHeader className="text-center items-center pt-8 pb-6">
          <Avatar className="h-28 w-28 mb-5 border-4 border-primary shadow-md">
            <AvatarImage src={`https://picsum.photos/seed/${user.username}/200`} alt={user.username} data-ai-hint="profile avatar" />
            <AvatarFallback className="text-4xl bg-secondary text-secondary-foreground">
              {initial}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl font-bold text-foreground">{user.username}</CardTitle>
          <CardDescription className="text-md text-muted-foreground pt-1">Your personal profile and settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 px-6 sm:px-8 pb-8">
          <div className="flex items-center space-x-4 p-4 bg-secondary/50 rounded-lg shadow-sm">
            <UserCircle className="h-7 w-7 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground font-medium">Username</p>
              <p className="font-semibold text-lg text-foreground">{user.username}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 p-4 bg-secondary/50 rounded-lg shadow-sm">
            <Mail className="h-7 w-7 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground font-medium">Email (Demo)</p>
              <p className="font-semibold text-lg text-foreground">{userEmail}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-secondary/50 rounded-lg shadow-sm">
            <ShieldCheck className="h-7 w-7 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground font-medium">Role</p>
              <Badge variant="default" className="font-semibold text-md px-4 py-1.5 bg-primary/10 text-primary border border-primary/30">
                {user.role}
              </Badge>
            </div>
          </div>

          <Button onClick={logout} className="w-full mt-8 h-12 text-base" variant="destructive" size="lg">
            <LogOut className="mr-2 h-5 w-5" /> Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
