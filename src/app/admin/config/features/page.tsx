'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useState, useEffect } from 'react';
import {
  Flag,
  Users,
  CreditCard,
  Mail,
  Calendar,
  Video,
  FileText,
  Shield,
  Loader2
} from 'lucide-react';

interface FeatureFlag {
  key: string;
  icon: any;
  enabled: boolean;
  description: string;
}

export default function FeaturesPage() {
  const { t, direction } = useAdminLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [features, setFeatures] = useState<FeatureFlag[]>([
    {
      key: 'features.lms.enabled',
      icon: FileText,
      enabled: true,
      description: 'Enable Learning Management System (Programs, Courses, Sessions)'
    },
    {
      key: 'features.payments.enabled',
      icon: CreditCard,
      enabled: true,
      description: 'Enable payment processing and billing features'
    },
    {
      key: 'features.enrollments.enabled',
      icon: Users,
      enabled: true,
      description: 'Enable enrollment management and tracking'
    },
    {
      key: 'features.emails.enabled',
      icon: Mail,
      enabled: true,
      description: 'Enable email notifications and templates'
    },
    {
      key: 'features.calendar.enabled',
      icon: Calendar,
      enabled: true,
      description: 'Enable calendar and scheduling features'
    },
    {
      key: 'features.video.enabled',
      icon: Video,
      enabled: true,
      description: 'Enable video conferencing integration (Zoom, Daily.co)'
    },
    {
      key: 'features.audit.enabled',
      icon: Shield,
      enabled: true,
      description: 'Enable audit logging and security tracking'
    },
    {
      key: 'features.grading.enabled',
      icon: Flag,
      enabled: true,
      description: 'Enable grading and assessment features'
    },
  ]);

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      // TODO: Fetch actual feature flags from API
      // const response = await fetch('/api/admin/features');
      // const data = await response.json();
      // setFeatures(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching features:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('features.loadError', 'Failed to load feature flags'),
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const handleToggle = async (featureKey: string) => {
    const updatedFeatures = features.map(f =>
      f.key === featureKey ? { ...f, enabled: !f.enabled } : f
    );
    setFeatures(updatedFeatures);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // TODO: Save feature flags to API
      // const response = await fetch('/api/admin/features', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ features }),
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: t('common.success', 'Success'),
        description: t('features.saveSuccess', 'Feature flags updated successfully'),
      });
    } catch (error) {
      console.error('Error saving features:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('features.saveError', 'Failed to save feature flags'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" suppressHydrationWarning>
              {t('features.title', 'Feature Flags')}
            </h1>
            <p className="text-muted-foreground mt-1" suppressHydrationWarning>
              {t('features.subtitle', 'Enable or disable platform features')}
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="ltr:mr-2 rtl:ml-2 h-4 w-4 animate-spin" />}
            <span suppressHydrationWarning>
              {t('common.saveChanges', 'Save Changes')}
            </span>
          </Button>
        </div>

        {/* Feature Flags Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.key}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {t(feature.key, feature.key.split('.').pop())}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {t(`${feature.key}.description`, feature.description)}
                        </CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={feature.enabled}
                      onCheckedChange={() => handleToggle(feature.key)}
                    />
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Warning Message */}
        <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="text-amber-900 dark:text-amber-100 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span suppressHydrationWarning>
                {t('features.warning.title', 'Important Notice')}
              </span>
            </CardTitle>
            <CardDescription className="text-amber-800 dark:text-amber-200" suppressHydrationWarning>
              {t('features.warning.description', 'Disabling features may affect existing functionality and user experience. Make sure to test changes in a staging environment first.')}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </AdminLayout>
  );
}
