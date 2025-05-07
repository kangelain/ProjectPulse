
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Rocket, LayoutDashboard, ShieldAlert, UserCircle, LogIn, LogOut, FileText, Briefcase } from 'lucide-react'; // Added Briefcase
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationsDropdown } from '@/components/layout/notifications-dropdown'; 

export function Header() {
  const { authState, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70 shadow-sm">
      <div className="container flex h-16 items-center px-4 sm:px-6">
        <Link href="/" className="mr-4 flex items-center space-x-2">
          <Rocket className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl text-foreground">
            ProjectPulse
          </span>
        </Link>
        <nav className="flex flex-1 items-center space-x-1 sm:space-x-2">
          <Button variant="ghost" asChild className="px-2.5 sm:px-3 text-sm">
            <Link href="/">
              <LayoutDashboard className="mr-1.5 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button variant="ghost" asChild className="px-2.5 sm:px-3 text-sm">
            <Link href="/risk-assessment">
              <ShieldAlert className="mr-1.5 h-4 w-4" />
              Risk AI
            </Link>
          </Button>
          <Button variant="ghost" asChild className="px-2.5 sm:px-3 text-sm">
            <Link href="/reports">
              <FileText className="mr-1.5 h-4 w-4" />
              Reports
            </Link>
          </Button>
          <Button variant="ghost" asChild className="px-2.5 sm:px-3 text-sm">
            <Link href="/resources">
              <Briefcase className="mr-1.5 h-4 w-4" />
              Resources
            </Link>
          </Button>
        </nav>
        
        <div className="flex items-center space-x-2 sm:space-x-3">
          <NotificationsDropdown /> 
          {authState.loading ? (
            <>
              <Skeleton className="h-9 w-20 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </>
          ) : authState.isAuthenticated ? (
            <>
              <Button variant="ghost" asChild className="px-2.5 sm:px-3 text-sm">
                <Link href="/profile">
                  <UserCircle className="mr-1.5 h-4 w-4" />
                  Profile
                </Link>
              </Button>
              <Button variant="outline" onClick={logout} size="sm" className="text-sm">
                <LogOut className="mr-1.5 h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <Button asChild size="sm" className="text-sm">
              <Link href="/login">
                <LogIn className="mr-1.5 h-4 w-4" />
                Login
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
