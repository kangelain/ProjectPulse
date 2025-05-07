
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Rocket, LayoutDashboard, ShieldAlert, UserCircle, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

export function Header() {
  const { authState, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Rocket className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block text-lg">
            ProjectPulse
          </span>
        </Link>
        <nav className="flex flex-1 items-center space-x-2">
          <Button variant="ghost" asChild>
            <Link href="/">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/risk-assessment">
              <ShieldAlert className="mr-2 h-4 w-4" />
              Risk Assessment
            </Link>
          </Button>
        </nav>
        
        <div className="flex items-center space-x-2">
          {authState.loading ? (
            <>
              <Skeleton className="h-9 w-20 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </>
          ) : authState.isAuthenticated ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/profile">
                  <UserCircle className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </Button>
              <Button variant="outline" onClick={logout} size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
