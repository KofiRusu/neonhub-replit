'use client';

import { useState } from 'react';
import { useCurrentUser, useLogout } from '@/hooks/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, User, Mail, Calendar, LogOut, Edit, Camera } from 'lucide-react';

export default function ProfilePage() {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
  });

  const { data: user, isLoading, error, refetch } = useCurrentUser();
  const logoutMutation = useLogout();

  const handleEditProfile = () => {
    if (user) {
      setEditForm({
        name: user.name || '',
        email: user.email || '',
      });
      setIsEditDialogOpen(true);
    }
  };

  const handleSaveProfile = async () => {
    // This would typically call an update profile API
    // For now, we'll just close the dialog and refetch
    setIsEditDialogOpen(false);
    await refetch();
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logoutMutation.mutateAsync();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error Loading Profile</h2>
          <p className="text-gray-600">Please try refreshing the page or contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600">Manage your personal information and account settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Overview */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <div className="relative mx-auto w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                {user?.image ? (
                  <img 
                    src={user.image} 
                    alt={user.name || user.email} 
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-gray-400" />
                )}
                <Button
                  size="sm"
                  className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0"
                  variant="outline"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <CardTitle>{user?.name || 'No name set'}</CardTitle>
              <CardDescription>{user?.email}</CardDescription>
              <Badge variant="secondary" className="mt-2">
                Free Plan
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleEditProfile} className="w-full">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button 
                onClick={handleLogout} 
                variant="outline" 
                className="w-full"
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your basic account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    Full Name
                  </div>
                  <p className="font-medium">{user?.name || 'Not set'}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Address
                  </div>
                  <p className="font-medium">{user?.email}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    Member Since
                  </div>
                  <p className="font-medium">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    Account Status
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
              <CardDescription>Your current plan and usage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Current Plan</p>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">Free</Badge>
                    <Button size="sm" variant="outline">
                      Upgrade
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Monthly Usage</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Campaigns</span>
                      <span>3 / 5</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Emails</span>
                      <span>450 / 1,000</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Social Posts</span>
                      <span>25 / 100</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Upgrade to Pro</h4>
                <p className="text-sm text-blue-800 mb-3">
                  Unlock unlimited campaigns, advanced analytics, AI-powered insights, and priority support.
                </p>
                <Button size="sm">
                  Upgrade Now
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your recent account activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="font-medium">Created "Summer Sale Campaign"</p>
                    <p className="text-sm text-gray-600">2 hours ago</p>
                  </div>
                  <Badge variant="secondary">Campaign</Badge>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="font-medium">Updated brand voice settings</p>
                    <p className="text-sm text-gray-600">1 day ago</p>
                  </div>
                  <Badge variant="outline">Settings</Badge>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="font-medium">Generated analytics report</p>
                    <p className="text-sm text-gray-600">3 days ago</p>
                  </div>
                  <Badge variant="secondary">Analytics</Badge>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium">Account created</p>
                    <p className="text-sm text-gray-600">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                  <Badge variant="default">System</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your personal information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Full Name</label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email Address</label>
              <Input
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="Enter your email"
                type="email"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveProfile}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}