'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  Target,
  BarChart3,
  Settings,
  User,
  Menu,
  LogOut,
  X
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useCurrentUser, useLogout } from '@/hooks/api';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Campaigns', href: '/campaigns', icon: Target },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Profile', href: '/profile', icon: User },
];

export function Navigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: user } = useCurrentUser();
  const logoutMutation = useLogout();
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const firstFocusableRef = useRef<HTMLAnchorElement>(null);
  const lastFocusableRef = useRef<HTMLButtonElement>(null);

  // Handle keyboard navigation for mobile menu
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
        mobileMenuButtonRef.current?.focus();
      }
      
      if (event.key === 'Tab' && isMobileMenuOpen) {
        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstFocusableRef.current) {
            event.preventDefault();
            lastFocusableRef.current?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastFocusableRef.current) {
            event.preventDefault();
            firstFocusableRef.current?.focus();
          }
        }
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Focus first element when menu opens
      setTimeout(() => firstFocusableRef.current?.focus(), 100);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logoutMutation.mutateAsync();
    }
  };

  // Announce to screen readers when navigation changes
  const announceNavigationChange = (item: string) => {
    const announcement = `Navigated to ${item}`;
    const announcer = document.getElementById('navigation-announcer');
    if (announcer) {
      announcer.textContent = announcement;
    }
  };

  return (
    <>
      {/* Screen reader announcer */}
      <div
        id="navigation-announcer"
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />
      
      {/* Desktop Navigation */}
      <nav className="hidden md:flex bg-white border-b border-gray-200" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link
                  href="/dashboard"
                  className="text-xl font-bold text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1"
                  aria-label="NeonHub - Go to dashboard"
                >
                  NeonHub
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8" role="menubar">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      role="menuitem"
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md',
                        isActive
                          ? 'border-blue-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      )}
                      onClick={() => announceNavigationChange(item.name)}
                    >
                      <item.icon className="h-4 w-4 mr-2" aria-hidden="true" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex items-center space-x-4">
                <Badge variant="secondary" className="hidden sm:block" aria-label="Current plan: Free Plan">
                  Free Plan
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  aria-label="Logout from NeonHub"
                  aria-describedby="logout-description"
                >
                  {logoutMutation.isPending && (
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" aria-hidden="true" />
                  )}
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only" id="logout-description">
                    {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-white border-b border-gray-200" role="navigation" aria-label="Mobile navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link
                href="/dashboard"
                className="text-xl font-bold text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1"
                aria-label="NeonHub - Go to dashboard"
              >
                NeonHub
              </Link>
            </div>
            <div className="flex items-center">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    ref={mobileMenuButtonRef}
                    variant="ghost"
                    size="sm"
                    aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                    aria-expanded={isMobileMenuOpen}
                    aria-controls="mobile-navigation-menu"
                  >
                    {isMobileMenuOpen ? (
                      <X className="h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Menu className="h-6 w-6" aria-hidden="true" />
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-[300px] sm:w-[400px]"
                  id="mobile-navigation-menu"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="mobile-menu-title"
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between py-4 border-b">
                      <div>
                        <h2 id="mobile-menu-title" className="font-medium text-lg">
                          {user?.name || user?.email}
                        </h2>
                        <Badge variant="secondary" className="mt-1" aria-label="Current plan: Free Plan">
                          Free Plan
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex-1 py-4">
                      <nav className="space-y-2" role="menubar" aria-orientation="vertical">
                        {navigation.map((item, index) => {
                          const isActive = pathname === item.href;
                          const isFirst = index === 0;
                          const isLast = index === navigation.length - 1;
                          
                          return (
                            <Link
                              key={item.name}
                              ref={isFirst ? firstFocusableRef : undefined}
                              href={item.href}
                              role="menuitem"
                              aria-current={isActive ? 'page' : undefined}
                              onClick={() => {
                                setIsMobileMenuOpen(false);
                                announceNavigationChange(item.name);
                              }}
                              className={cn(
                                'flex items-center px-3 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                                isActive
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              )}
                            >
                              <item.icon className="h-5 w-5 mr-3" aria-hidden="true" />
                              {item.name}
                            </Link>
                          );
                        })}
                      </nav>
                    </div>
                    
                    <div className="py-4 border-t">
                      <Button
                        ref={lastFocusableRef}
                        variant="outline"
                        className="w-full"
                        onClick={handleLogout}
                        disabled={logoutMutation.isPending}
                        aria-label="Logout from NeonHub"
                      >
                        {logoutMutation.isPending && (
                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" aria-hidden="true" />
                        )}
                        <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
                        Logout
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}