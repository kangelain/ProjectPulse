
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, UserCircle, ShieldCheck, Briefcase } from 'lucide-react';
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
    return <div className="flex justify-center items-center min-h-screen">Loading profile...</div>;
  }

  const { user } = authState;
  const initial = user.username?.charAt(0).toUpperCase() || '?';

  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader className="text-center">
          <Avatar className="mx-auto h-24 w-24 mb-4 border-2 border-primary">
            {/* Placeholder for actual image if available */}
            {/* <AvatarImage src="https://picsum.photos/200" alt={user.username} data-ai-hint="profile avatar" /> */}
            <AvatarFallback className="text-3xl bg-secondary text-secondary-foreground">
              {initial}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl font-bold">{user.username}</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">Your personal profile and settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-3 p-4 bg-secondary/50 rounded-lg">
            <UserCircle className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Username</p>
              <p className="font-semibold">{user.username}</p>
            </div>
          </div>
          
          {user.email && (
            <div className="flex items-center space-x-3 p-4 bg-secondary/50 rounded-lg">
              <Briefcase className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Email (Demo)</p>
                <p className="font-semibold">{user.email}</p>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-3 p-4 bg-secondary/50 rounded-lg">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <Badge variant="outline" className="font-semibold text-base px-3 py-1 border-primary text-primary">
                {user.role}
              </Badge>
            </div>
          </div>

          <Button onClick={logout} className="w-full mt-6" variant="destructive">
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
