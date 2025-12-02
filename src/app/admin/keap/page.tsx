'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Users,
  Tag,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
  Upload
} from 'lucide-react';

export default function KeapDashboardPage() {
  const { t, direction } = useAdminLanguage();
  const isRtl = direction === 'rtl';

  const [stats, setStats] = useState({
    totalTags: 0,
    syncedStudents: 0,
    lastSyncDate: null as string | null,
    autoSyncEnabled: false
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncActivity, setSyncActivity] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Only fetch recent sync activity from audit events (local database)
      // Do NOT fetch tags from Keap API automatically
      const activityResponse = await fetch('/api/admin/keap/sync/activity');
      const activityResult = await activityResponse.json();

      setStats({
        totalTags: 0, // Will be updated when tags are manually fetched
        syncedStudents: 0, // You can implement this later
        lastSyncDate: activityResult.success && activityResult.data.length > 0
          ? activityResult.data[0].event_timestamp
          : null,
        autoSyncEnabled: true
      });

      if (activityResult.success) {
        setSyncActivity(activityResult.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/admin/keap/sync/bulk', {
        method: 'POST'
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || `Synced ${result.data.synced} students successfully`);
        await fetchStats();
      } else {
        toast.error(result.error || 'Bulk sync failed');
      }
    } catch (error) {
      console.error('Error during bulk sync:', error);
      toast.error('Bulk sync failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <AdminLayout>
      <div className={`space-y-6 ${isRtl ? 'rtl' : 'ltr'}`}>
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">
            {t('admin.keap.dashboard.title', 'Keap Integration')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('admin.keap.dashboard.description', 'Manage CRM sync and student segmentation')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 border rounded-lg bg-card">
            <div className="flex items-center justify-between mb-2">
              <Tag className="h-8 w-8 text-primary" />
              {stats.autoSyncEnabled ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.totalTags}
            </div>
            <div className="text-sm text-muted-foreground">
              {t('admin.keap.dashboard.totalTags', 'Total Tags')}
            </div>
          </div>

          <div className="p-6 border rounded-lg bg-card">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.syncedStudents}
            </div>
            <div className="text-sm text-muted-foreground">
              {t('admin.keap.dashboard.syncedStudents', 'Synced Students')}
            </div>
          </div>

          <div className="p-6 border rounded-lg bg-card">
            <div className="flex items-center justify-between mb-2">
              <RefreshCw className="h-8 w-8 text-primary" />
            </div>
            <div className="text-2xl font-bold">
              {stats.autoSyncEnabled ? t('admin.keap.dashboard.enabled', 'Enabled') : t('admin.keap.dashboard.disabled', 'Disabled')}
            </div>
            <div className="text-sm text-muted-foreground">
              {t('admin.keap.dashboard.autoSync', 'Auto-Sync')}
            </div>
          </div>

          <div className="p-6 border rounded-lg bg-card">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-sm font-medium">
              {stats.lastSyncDate ? new Date(stats.lastSyncDate).toLocaleString() : t('admin.keap.dashboard.never', 'Never')}
            </div>
            <div className="text-sm text-muted-foreground">
              {t('admin.keap.dashboard.lastSync', 'Last Sync')}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/admin/keap/tags"
            className="p-6 border rounded-lg bg-card hover:shadow-md transition-shadow group"
          >
            <Tag className="h-8 w-8 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2 flex items-center justify-between">
              {t('admin.keap.dashboard.manageTags', 'Manage Tags')}
              <ArrowRight className={`h-5 w-5 text-muted-foreground group-hover:${isRtl ? '-translate-x' : 'translate-x'}-1 transition-transform`} />
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('admin.keap.dashboard.manageTagsDesc', 'View and create tags for student segmentation')}
            </p>
          </Link>

          <button
            onClick={handleBulkSync}
            disabled={syncing}
            className={`p-6 border rounded-lg bg-card hover:shadow-md transition-shadow group ${isRtl ? 'text-right' : 'text-left'} disabled:opacity-50`}
          >
            {syncing ? (
              <Loader2 className="h-8 w-8 text-primary mb-4 animate-spin" />
            ) : (
              <Upload className="h-8 w-8 text-primary mb-4" />
            )}
            <h3 className="text-lg font-semibold mb-2">
              {t('admin.keap.dashboard.bulkSync', 'Bulk Sync Students')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('admin.keap.dashboard.bulkSyncDesc', 'Sync all existing students to Keap CRM')}
            </p>
          </button>

          <Link
            href="/admin/config/integrations"
            className="p-6 border rounded-lg bg-card hover:shadow-md transition-shadow group"
          >
            <RefreshCw className="h-8 w-8 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2 flex items-center justify-between">
              {t('admin.keap.dashboard.settings', 'Integration Settings')}
              <ArrowRight className={`h-5 w-5 text-muted-foreground group-hover:${isRtl ? '-translate-x' : 'translate-x'}-1 transition-transform`} />
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('admin.keap.dashboard.settingsDesc', 'Configure Keap API credentials and sync options')}
            </p>
          </Link>
        </div>

        {/* Sync Activity */}
        <div className="border rounded-lg bg-card p-6">
          <h2 className="text-xl font-bold mb-4">
            {t('admin.keap.dashboard.recentActivity', 'Recent Sync Activity')}
          </h2>
          {syncActivity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('admin.keap.dashboard.noActivity', 'No recent sync activity')}
            </div>
          ) : (
            <div className="space-y-3">
              {syncActivity.map((activity, index) => (
                <div
                  key={activity.id || index}
                  className={`flex items-start gap-3 p-3 border rounded-lg ${isRtl ? 'flex-row-reverse' : ''}`}
                >
                  <div className="p-2 bg-primary/10 rounded">
                    <CheckCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div className={`flex-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                    <div className="font-medium">{activity.action}</div>
                    <div className="text-sm text-muted-foreground">{activity.description}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(activity.event_timestamp).toLocaleString()}
                    </div>
                  </div>
                  {activity.new_values?.synced && (
                    <div className={`text-sm ${isRtl ? 'text-left' : 'text-right'}`}>
                      <div className="font-medium text-green-600">
                        {activity.new_values.synced} {t('admin.keap.dashboard.synced', 'synced')}
                      </div>
                      {activity.new_values.failed > 0 && (
                        <div className="text-destructive">
                          {activity.new_values.failed} {t('admin.keap.dashboard.failed', 'failed')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="border border-primary/20 bg-primary/5 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">
            {t('admin.keap.dashboard.autoSyncInfo', 'Automatic Sync')}
          </h3>
          <p className="text-muted-foreground text-sm">
            {t('admin.keap.dashboard.autoSyncInfoDesc', 'When auto-sync is enabled, students are automatically synced to Keap when they enroll in courses or complete lessons. Tags are applied based on their activity.')}
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
