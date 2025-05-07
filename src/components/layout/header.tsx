
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Rocket, LayoutDashboard, ShieldAlert, UserCircle, LogIn, LogOut, FileText, Briefcase, Calculator } from 'lucide-react'; // Added Calculator
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationsDropdown } from '@/components/layout/notifications-dropdown';

export function Header() {
  const { authState, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70 shadow-sm"> {/* Subtle transparency */}
      <div className="container flex h-14 items-center px-4 sm:px-6"> {/* Reduced height */}
        <Link href="/" className="mr-4 flex items-center space-x-2 shrink-0"> {/* Added shrink-0 */}
          <Rocket className="h-5 w-5 text-primary" /> {/* Adjusted size */}
          <span className="font-bold text-lg text-foreground"> {/* Adjusted size */}
            ProjectPulse
          </span>
        </Link>
        <nav className="flex flex-1 items-center space-x-1 sm:space-x-1.5"> {/* Reduced spacing */}
          {/* Adjusted button padding and text size */}
          <Button variant="ghost" asChild className="px-2 sm:px-2.5 h-8 text-xs">
            <Link href="/">
              <LayoutDashboard className="mr-1 h-3.5 w-3.5" />
              Dashboard
            </Link>
          </Button>
          <Button variant="ghost" asChild className="px-2 sm:px-2.5 h-8 text-xs">
            <Link href="/risk-assessment">
              <ShieldAlert className="mr-1 h-3.5 w-3.5" />
              Risk AI
            </Link>
          </Button>
          <Button variant="ghost" asChild className="px-2 sm:px-2.5 h-8 text-xs">
            <Link href="/reports">
              <FileText className="mr-1 h-3.5 w-3.5" />
              Reports
            </Link>
          </Button>
          <Button variant="ghost" asChild className="px-2 sm:px-2.5 h-8 text-xs">
            <Link href="/resources">
              <Briefcase className="mr-1 h-3.5 w-3.5" />
              Resources
            </Link>
          </Button>
          <Button variant="ghost" asChild className="px-2 sm:px-2.5 h-8 text-xs">
            <Link href="/calculators">
              <Calculator className="mr-1 h-3.5 w-3.5" />
              Calculators
            </Link>
          </Button>
        </nav>

        <div className="flex items-center space-x-2 sm:space-x-2"> {/* Reduced spacing */}
          <NotificationsDropdown />
          {authState.loading ? (
            <>
              <Skeleton className="h-8 w-16 rounded-md" /> {/* Adjusted size */}
              <Skeleton className="h-8 w-8 rounded-full" /> {/* Adjusted size */}
            </>
          ) : authState.isAuthenticated ? (
            <>
              <Button variant="ghost" asChild className="px-2 sm:px-2.5 h-8 text-xs">
                <Link href="/profile">
                  <UserCircle className="mr-1 h-3.5 w-3.5" />
                  Profile
                </Link>
              </Button>
              <Button variant="outline" onClick={logout} size="sm" className="h-8 px-2.5 text-xs"> {/* Adjusted size */}
                <LogOut className="mr-1 h-3.5 w-3.5" />
                Logout
              </Button>
            </>
          ) : (
            <Button asChild size="sm" className="h-8 px-2.5 text-xs"> {/* Adjusted size */}
              <Link href="/login">
                <LogIn className="mr-1 h-3.5 w-3.5" />
                Login
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
