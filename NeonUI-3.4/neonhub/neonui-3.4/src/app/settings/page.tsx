'use client';

import { useState } from 'react';
import { useUserSettings, useUpdateSettings, useCurrentUser } from '@/hooks/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Bell, Shield, Palette, Globe } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const { data: user } = useCurrentUser();
  const { data: settings, isLoading, error } = useUserSettings();
  const updateSettingsMutation = useUpdateSettings();

  const [formData, setFormData] = useState({
    // Profile settings
    name: user?.name || '',
    email: user?.email || '',
    
    // Brand voice settings
    brandVoice: {
      tone: 'professional',
      style: 'friendly',
      personality: 'innovative'
    },
    
    // Notification settings
    emailNotifications: true,
    pushNotifications: false,
    notificationFrequency: 'realtime',
    
    // Regional settings
    timezone: 'UTC',
    locale: 'en-US',
    dateFormat: 'MM/DD/YYYY',
    
    // Privacy settings
    dataRetention: 90,
    allowAnalytics: true,
    allowPersonalization: true,
    
    // API settings
    apiRateLimit: 1000,
    webhookUrl: '',
    webhookSecret: '',
  });

  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData(prev => {
      const sectionData = prev[section as keyof typeof prev];
      return {
        ...prev,
        [section]: typeof sectionData === 'object' && sectionData !== null
          ? { ...sectionData, [field]: value }
          : value
      };
    });
  };

  const handleSave = async (section: string) => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      await updateSettingsMutation.mutateAsync({
        [section]: formData[section as keyof typeof formData]
      });
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
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
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error Loading Settings</h2>
          <p className="text-gray-600">Please try refreshing the page or contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account and application preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="brand">Brand Voice</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your personal information and account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email Address</label>
                  <Input
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                    type="email"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={() => handleSave('name')} disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </Button>
              </div>
              
              {saveMessage && (
                <div className={`p-3 rounded-md ${saveMessage.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  {saveMessage}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brand" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="h-5 w-5 mr-2" />
                Brand Voice Settings
              </CardTitle>
              <CardDescription>Define your brand's personality and communication style</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Tone</label>
                  <select
                    value={formData.brandVoice.tone}
                    onChange={(e) => handleInputChange('brandVoice', 'tone', e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="formal">Formal</option>
                    <option value="friendly">Friendly</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Style</label>
                  <select
                    value={formData.brandVoice.style}
                    onChange={(e) => handleInputChange('brandVoice', 'style', e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="friendly">Friendly</option>
                    <option value="authoritative">Authoritative</option>
                    <option value="conversational">Conversational</option>
                    <option value="technical">Technical</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Personality</label>
                  <select
                    value={formData.brandVoice.personality}
                    onChange={(e) => handleInputChange('brandVoice', 'personality', e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="innovative">Innovative</option>
                    <option value="traditional">Traditional</option>
                    <option value="playful">Playful</option>
                    <option value="serious">Serious</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={() => handleSave('brandVoice')} disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  Save Brand Voice
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Control how and when you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-gray-600">Receive updates via email</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.emailNotifications}
                    onChange={(e) => setFormData(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                    className="h-4 w-4"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-gray-600">Receive browser push notifications</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.pushNotifications}
                    onChange={(e) => setFormData(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                    className="h-4 w-4"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Notification Frequency</label>
                  <select
                    value={formData.notificationFrequency}
                    onChange={(e) => setFormData(prev => ({ ...prev, notificationFrequency: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="realtime">Real-time</option>
                    <option value="daily">Daily Digest</option>
                    <option value="weekly">Weekly Summary</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={() => handleSave('emailNotifications')} disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  Save Notifications
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Privacy & Security
              </CardTitle>
              <CardDescription>Manage your data privacy and security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Data Retention (days)</label>
                  <Input
                    type="number"
                    value={formData.dataRetention}
                    onChange={(e) => setFormData(prev => ({ ...prev, dataRetention: parseInt(e.target.value) }))}
                    min="30"
                    max="365"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Allow Analytics</p>
                    <p className="text-sm text-gray-600">Help us improve by sharing usage data</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.allowAnalytics}
                    onChange={(e) => setFormData(prev => ({ ...prev, allowAnalytics: e.target.checked }))}
                    className="h-4 w-4"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Personalization</p>
                    <p className="text-sm text-gray-600">Allow personalized content recommendations</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.allowPersonalization}
                    onChange={(e) => setFormData(prev => ({ ...prev, allowPersonalization: e.target.checked }))}
                    className="h-4 w-4"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={() => handleSave('dataRetention')} disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  Save Privacy Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                API Configuration
              </CardTitle>
              <CardDescription>Manage your API access and webhooks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">API Rate Limit (requests/hour)</label>
                  <Input
                    type="number"
                    value={formData.apiRateLimit}
                    onChange={(e) => setFormData(prev => ({ ...prev, apiRateLimit: parseInt(e.target.value) }))}
                    min="100"
                    max="10000"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Webhook URL</label>
                  <Input
                    value={formData.webhookUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, webhookUrl: e.target.value }))}
                    placeholder="https://your-webhook-url.com"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Webhook Secret</label>
                  <Input
                    type="password"
                    value={formData.webhookSecret}
                    onChange={(e) => setFormData(prev => ({ ...prev, webhookSecret: e.target.value }))}
                    placeholder="Enter webhook secret"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={() => handleSave('apiRateLimit')} disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  Save API Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}