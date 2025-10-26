import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Page Not Found</CardTitle>
            <CardDescription className="text-gray-600">
              The page you're looking for doesn't exist or has been moved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-500">
                Error code: <span className="font-mono font-medium">404</span>
              </p>
              <p className="text-sm text-gray-500">
                Please check the URL or return to the dashboard.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/dashboard" className="flex-1">
                <Button className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>
              </Link>
              
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
            
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-gray-600 mb-3">
                Looking for something specific?
              </p>
              <div className="space-y-2">
                <Link href="/dashboard" className="block text-sm text-blue-600 hover:text-blue-800">
                  → Dashboard
                </Link>
                <Link href="/campaigns" className="block text-sm text-blue-600 hover:text-blue-800">
                  → Campaigns
                </Link>
                <Link href="/analytics" className="block text-sm text-blue-600 hover:text-blue-800">
                  → Analytics
                </Link>
                <Link href="/settings" className="block text-sm text-blue-600 hover:text-blue-800">
                  → Settings
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}