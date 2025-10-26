/**
 * Lazy-loaded routes for performance optimization
 */

import { lazy } from 'react';
import { withLazyLoading } from '@/components/lazy-loading';
import { LoadingSpinner, CardSkeleton } from '@/components/lazy-loading';

// Lazy load page components
export const LazyDashboard = lazy(() => import('./dashboard/page'));
export const LazyCampaigns = lazy(() => import('./campaigns/page'));
export const LazyAnalytics = lazy(() => import('./analytics/page'));
export const LazySettings = lazy(() => import('./settings/page'));
export const LazyProfile = lazy(() => import('./profile/page'));
export const LazyNotFound = lazy(() => import('./not-found'));

// Lazy load heavy components (these will be created as needed)
// export const LazyCampaignForm = lazy(() => import('@/components/campaign-form'));
// export const LazyAnalyticsChart = lazy(() => import('@/components/analytics-chart'));
// export const LazySettingsForm = lazy(() => import('@/components/settings-form'));

// HOCs with loading states
export const DashboardPage = withLazyLoading(
  () => import('./dashboard/page'),
  <LoadingSpinner message="Loading dashboard..." />
);

export const CampaignsPage = withLazyLoading(
  () => import('./campaigns/page'),
  <div className="p-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  </div>
);

export const AnalyticsPage = withLazyLoading(
  () => import('./analytics/page'),
  <LoadingSpinner message="Loading analytics..." />
);

export const SettingsPage = withLazyLoading(
  () => import('./settings/page'),
  <LoadingSpinner message="Loading settings..." />
);

export const ProfilePage = withLazyLoading(
  () => import('./profile/page'),
  <LoadingSpinner message="Loading profile..." />
);

export const NotFoundPage = withLazyLoading(
  () => import('./not-found'),
  <LoadingSpinner message="Loading..." />
);

// Preload critical routes
export function preloadCriticalRoutes() {
  if (typeof window !== 'undefined') {
    // Preload dashboard (most likely first page)
    import('./dashboard/page');
    
    // Preload common routes on idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        import('./campaigns/page');
        import('./analytics/page');
      });
    }
  }
}

// Dynamic route loading based on user behavior
export function preloadRoute(route: string) {
  if (typeof window === 'undefined') return;
  
  const routeMap: Record<string, () => Promise<any>> = {
    '/dashboard': () => import('./dashboard/page'),
    '/campaigns': () => import('./campaigns/page'),
    '/analytics': () => import('./analytics/page'),
    '/settings': () => import('./settings/page'),
    '/profile': () => import('./profile/page'),
  };
  
  const importFunc = routeMap[route];
  if (importFunc) {
    importFunc();
  }
}

// Intersection observer-based preloading
export function setupIntersectionPreloading() {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const link = entry.target as HTMLAnchorElement;
        const href = link.getAttribute('href');
        if (href) {
          preloadRoute(href);
          observer.unobserve(link);
        }
      }
    });
  }, {
    rootMargin: '50px'
  });
  
  // Observe navigation links
  const navLinks = document.querySelectorAll('a[href^="/"]');
  navLinks.forEach(link => observer.observe(link));
}

// Service worker for caching
export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
}

// Resource hints
export function addResourceHints() {
  if (typeof document === 'undefined') return;
  
  // DNS prefetch for external resources
  const dnsPrefetch = [
    '//fonts.googleapis.com',
    '//fonts.gstatic.com',
    '//api.neonhubecosystem.com'
  ];
  
  dnsPrefetch.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = `https:${domain}`;
    document.head.appendChild(link);
  });
  
  // Preconnect for critical resources
  const preconnect = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com'
  ];
  
  preconnect.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = url;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}