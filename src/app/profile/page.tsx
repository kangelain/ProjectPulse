
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, UserCircle, ShieldCheck, Loader2, Mail } from 'lucide-react'; // Removed Briefcase
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
    <div className="container mx-auto py-10 px-4"> {/* Simplified container padding */}
      <Card className="max-w-lg mx-auto shadow-xl"> {/* Adjusted max-width and shadow */}
        <CardHeader className="text-center items-center pt-8 pb-6">
          <Avatar className="h-20 w-20 mb-4 border-2 border-primary/30 shadow-sm"> {/* Slightly smaller avatar, softer border */}
            <AvatarImage src={`https://picsum.photos/seed/${user.username}/200`} alt={user.username} data-ai-hint="profile avatar" />
            <AvatarFallback className="text-2xl bg-secondary text-secondary-foreground"> {/* Adjusted text size */}
              {initial}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl font-semibold text-foreground">{user.username}</CardTitle> {/* Adjusted title size */}
          <CardDescription className="text-sm text-muted-foreground pt-1">Your personal profile and settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-6 sm:px-8 pb-8"> {/* Adjusted spacing */}
          <div className="flex items-center space-x-3 p-3 bg-secondary/50 rounded-md shadow-xs border border-border/50"> {/* Softer background, smaller padding, subtle shadow, added border */}
            <UserCircle className="h-5 w-5 text-primary flex-shrink-0" /> {/* Adjusted icon size */}
            <div>
              <p className="text-xs text-muted-foreground font-medium">Username</p>
              <p className="font-medium text-sm text-foreground">{user.username}</p> {/* Adjusted text size */}
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-secondary/50 rounded-md shadow-xs border border-border/50">
            <Mail className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground font-medium">Email (Demo)</p>
              <p className="font-medium text-sm text-foreground">{userEmail}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-secondary/50 rounded-md shadow-xs border border-border/50">
            <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground font-medium">Role</p>
              <Badge variant="secondary" className="font-medium text-xs px-2.5 py-0.5"> {/* Changed variant to secondary, adjusted size/padding */}
                {user.role}
              </Badge>
            </div>
          </div>

          <Button onClick={logout} className="w-full mt-6 h-10 text-sm font-semibold" variant="destructive" size="default"> {/* Adjusted margin and height/size */}
            <LogOut className="mr-1.5 h-4 w-4" /> Logout {/* Adjusted icon size */}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
