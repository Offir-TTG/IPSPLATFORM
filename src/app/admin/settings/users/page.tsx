'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useAdminLanguage, useTenant } from '@/context/AppContext';
import { Button } from '@/components/ui/button';

interface Invitation {
  id: string;
  email: string;
  role: string;
  first_name: string | null;
  last_name: string | null;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  created_at: string;
  expires_at: string;
  token: string;
}

interface TenantUser {
  id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  users: {
    email: string;
    first_name: string;
    last_name: string;
  };
}

export default function UsersPage() {
  const { t } = useAdminLanguage();
  const { tenantName, isAdmin } = useTenant();
  const [activeTab, setActiveTab] = useState<'users' | 'invitations'>('users');
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'student',
    first_name: '',
    last_name: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadUsers();
    loadInvitations();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/tenant/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadInvitations = async () => {
    try {
      const response = await fetch('/api/admin/tenant/invitations');
      const data = await response.json();
      if (data.success) {
        setInvitations(data.data);
      }
    } catch (err) {
      console.error('Error loading invitations:', err);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/tenant/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(t('user_invited_successfully', 'User invited successfully'));
        setShowInviteModal(false);
        setInviteForm({ email: '', role: 'student', first_name: '', last_name: '' });
        loadInvitations();
      } else {
        setError(data.error || t('failed_to_invite_user', 'Failed to invite user'));
      }
    } catch (err) {
      setError(t('error_inviting_user', 'Error inviting user'));
      console.error('Error inviting user:', err);
    }
  };

  const handleRevokeInvitation = async (id: string) => {
    if (!confirm(t('confirm_revoke_invitation', 'Are you sure you want to revoke this invitation?'))) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/tenant/invitations/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(t('invitation_revoked', 'Invitation revoked successfully'));
        loadInvitations();
      } else {
        setError(data.error || t('failed_to_revoke_invitation', 'Failed to revoke invitation'));
      }
    } catch (err) {
      setError(t('error_revoking_invitation', 'Error revoking invitation'));
      console.error('Error revoking invitation:', err);
    }
  };

  const handleResendInvitation = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/tenant/invitations/${id}`, {
        method: 'PATCH',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(t('invitation_resent', 'Invitation resent successfully'));
        loadInvitations();
      } else {
        setError(data.error || t('failed_to_resend_invitation', 'Failed to resend invitation'));
      }
    } catch (err) {
      setError(t('error_resending_invitation', 'Error resending invitation'));
      console.error('Error resending invitation:', err);
    }
  };

  const copyInvitationLink = (token: string) => {
    const url = `${window.location.origin}/invitations/accept?token=${token}`;
    navigator.clipboard.writeText(url);
    setSuccess(t('invitation_link_copied', 'Invitation link copied to clipboard'));
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <p className="text-red-600">{t('admin_access_required', 'Admin access required')}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">
          {t('user_management', 'User Management')}
        </h1>
        <p className="text-gray-600">
          {t('manage_users_for', 'Manage users for')} {tenantName}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded text-green-800">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('users', 'Users')} ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'invitations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('invitations', 'Invitations')} ({invitations.filter((i) => i.status === 'pending').length})
          </button>
        </nav>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">{t('active_users', 'Active Users')}</h2>
            <Button onClick={() => setShowInviteModal(true)}>
              {t('invite_user', 'Invite User')}
            </Button>
          </div>

          {loading ? (
            <p>{t('loading', 'Loading...')}</p>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('name', 'Name')}
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('email', 'Email')}
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('role', 'Role')}
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('status', 'Status')}
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('joined', 'Joined')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.users.first_name} {user.users.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.users.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.joined_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Invitations Tab */}
      {activeTab === 'invitations' && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">{t('pending_invitations', 'Pending Invitations')}</h2>
            <Button onClick={() => setShowInviteModal(true)}>
              {t('invite_user', 'Invite User')}
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('email', 'Email')}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('role', 'Role')}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('status', 'Status')}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('expires', 'Expires')}
                  </th>
                  <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('actions', 'Actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invitations.map((invitation) => (
                  <tr key={invitation.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{invitation.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {invitation.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        invitation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        invitation.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {invitation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invitation.expires_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {invitation.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyInvitationLink(invitation.token)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {t('copy_link', 'Copy Link')}
                          </button>
                          <button
                            onClick={() => handleResendInvitation(invitation.id)}
                            className="text-green-600 hover:text-green-800"
                          >
                            {t('resend', 'Resend')}
                          </button>
                          <button
                            onClick={() => handleRevokeInvitation(invitation.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            {t('revoke', 'Revoke')}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">{t('invite_new_user', 'Invite New User')}</h3>
            <form onSubmit={handleInvite}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">{t('email', 'Email')}</label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">{t('first_name', 'First Name')}</label>
                <input
                  type="text"
                  value={inviteForm.first_name}
                  onChange={(e) => setInviteForm({ ...inviteForm, first_name: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">{t('last_name', 'Last Name')}</label>
                <input
                  type="text"
                  value={inviteForm.last_name}
                  onChange={(e) => setInviteForm({ ...inviteForm, last_name: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">{t('role', 'Role')}</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="student">{t('student', 'Student')}</option>
                  <option value="instructor">{t('instructor', 'Instructor')}</option>
                  <option value="admin">{t('admin', 'Admin')}</option>
                  <option value="support">{t('support', 'Support')}</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="bg-gray-500 hover:bg-gray-600"
                >
                  {t('cancel', 'Cancel')}
                </Button>
                <Button type="submit">
                  {t('send_invitation', 'Send Invitation')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
