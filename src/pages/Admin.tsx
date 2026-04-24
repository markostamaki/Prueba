import React, { useState } from 'react';
import { 
  Users, 
  Shield, 
  Star, 
  Search, 
  Filter, 
  MoreVertical, 
  UserX, 
  CheckCircle2, 
  Trash2, 
  Crown,
  Activity,
  UserPlus,
  Download
} from 'lucide-react';
import { useCollection, updateRecord, deleteRecord } from '../hooks/useFirestore';
import { useAuth } from '../lib/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';

export default function Admin() {
  const { user, role, language } = useAuth();
  const { t } = useTranslation();
  const { data: users, loading: usersLoading } = useCollection<any>('users', [], true, true);
  const { data: allProperties } = useCollection<any>('properties', [], true, true);
  const { data: allExpenses } = useCollection<any>('expenses', [], true, true);
  const [searchTerm, setSearchTerm] = useState('');

  const loading = usersLoading;

  if (role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const locale = language.startsWith('es') ? es : enUS;
  const dateFormat = language.startsWith('es') ? 'dd/MM/yyyy' : 'MMM d, yyyy';

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: users.length,
    premium: users.filter(u => u.plan === 'premium').length,
    active: users.filter(u => u.status === 'active').length,
    newThisWeek: users.filter(u => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(u.createdAt) > weekAgo;
    }).length
  };

  const activeRate = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0;

  const userStats = (uid: string) => ({
    properties: allProperties.filter((p: any) => p.ownerId === uid).length,
    expenses: allExpenses.filter((e: any) => e.userId === uid).length
  });

  const handleAction = async (id: string, action: 'suspend' | 'reactivate' | 'make_admin' | 'revoke_admin' | 'delete' | 'toggle_plan') => {
    try {
      if (action === 'delete') {
        if (window.confirm(t('admin.users.actions.delete_confirm'))) {
          await deleteRecord('users', id);
        }
        return;
      }

      const targetUser = users.find(u => u.id === id);
      if (!targetUser) return;

      let updates = {};
      if (action === 'suspend') updates = { status: 'suspended' };
      if (action === 'reactivate') updates = { status: 'active' };
      if (action === 'make_admin') updates = { role: 'admin' };
      if (action === 'revoke_admin') updates = { role: 'user' };
      if (action === 'toggle_plan') updates = { plan: targetUser.plan === 'premium' ? 'free' : 'premium' };

      await updateRecord('users', id, updates);
    } catch (error) {
      console.error('Admin action failed:', error);
    }
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Plan', 'Role', 'Status', 'Joined'];
    const rows = filteredUsers.map(u => [
      u.displayName,
      u.email,
      u.plan,
      u.role,
      u.status,
      u.createdAt
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shinigami_users_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight uppercase border-l-4 border-red-600 pl-4">
            {t('admin.title')}
          </h1>
          <p className="text-gray-500 mt-1">{t('admin.subtitle')}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 border-b-4 border-red-600">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t('admin.stats.total_users')}</p>
          </div>
          <p className="text-4xl font-black text-gray-900">{stats.total}</p>
        </div>

        <div className="card p-6 border-b-4 border-amber-500">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Star className="w-6 h-6 fill-amber-600" />
            </div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t('admin.stats.premium_users')}</p>
          </div>
          <p className="text-4xl font-black text-gray-900">{stats.premium}</p>
        </div>

        <div className="card p-6 border-b-4 border-blue-500">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <UserPlus className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t('admin.stats.new_users')}</p>
          </div>
          <p className="text-4xl font-black text-gray-900">{stats.newThisWeek}</p>
        </div>

        <div className="card p-6 border-b-4 border-green-500">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <Activity className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t('admin.stats.active_rate')}</p>
          </div>
          <p className="text-4xl font-black text-gray-900">{activeRate}%</p>
        </div>
      </div>

      {/* User Table Card */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-600" />
            {t('admin.users.table_title')}
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={() => window.open('/api/admin/backup/db', '_blank')}
              className="flex items-center gap-2 px-4 h-10 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-white transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              Backup DB
            </button>
            <button 
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 h-10 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-white transition-all shadow-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder={t('admin.users.search_placeholder')}
                className="input pl-10 h-10 text-sm min-w-[240px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white text-gray-400 uppercase text-[10px] font-bold tracking-widest border-b border-gray-100">
                <th className="px-6 py-4">{t('admin.users.columns.user')}</th>
                <th className="px-6 py-4">{t('admin.users.columns.plan')}</th>
                <th className="px-6 py-4">{t('admin.users.columns.role')}</th>
                <th className="px-6 py-4">{t('admin.users.columns.status')}</th>
                <th className="px-6 py-4">{t('admin.users.columns.joined')}</th>
                <th className="px-6 py-4 text-right">{t('admin.users.columns.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-gray-400 italic">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-gray-400 italic">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {u.photoURL ? (
                          <img src={u.photoURL} className="w-8 h-8 rounded-full border border-gray-100 shadow-sm" alt="" />
                        ) : (
                          <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold text-xs">
                            {u.displayName?.[0] || 'U'}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-gray-900">{u.displayName}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-gray-500 font-mono">{u.email}</p>
                            <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 rounded">P: {userStats(u.id).properties}</span>
                            <span className="text-[10px] bg-red-50 text-red-400 px-1.5 rounded">E: {userStats(u.id).expenses}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                        u.plan === 'premium' ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
                      )}>
                        {u.plan === 'premium' && <Star className="w-3 h-3 fill-amber-700" />}
                        {u.plan}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                        u.role === 'admin' ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                      )}>
                        {u.role || 'user'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                        u.status === 'active' ? "text-green-600" : "text-red-600"
                      )}>
                        {u.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                        {u.status || 'active'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 font-mono">
                      {u.createdAt ? format(new Date(u.createdAt), dateFormat, { locale }) : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {u.id !== user?.id && (
                          <>
                            <button 
                              onClick={() => handleAction(u.id, 'toggle_plan')}
                              className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                              title="Toggle Plan"
                            >
                              <Star className={cn("w-4 h-4", u.plan === 'premium' ? "fill-amber-400 text-amber-400" : "")} />
                            </button>

                            {u.status === 'suspended' ? (
                              <button 
                                onClick={() => handleAction(u.id, 'reactivate')}
                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                title={t('admin.users.actions.reactivate')}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleAction(u.id, 'suspend')}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title={t('admin.users.actions.suspend')}
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            )}

                            {u.role === 'admin' ? (
                              <button 
                                onClick={() => handleAction(u.id, 'revoke_admin')}
                                className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                title={t('admin.users.actions.revoke_admin')}
                              >
                                <Crown className="w-4 h-4" />
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleAction(u.id, 'make_admin')}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title={t('admin.users.actions.make_admin')}
                              >
                                <Shield className="w-4 h-4" />
                              </button>
                            )}

                            <button 
                              onClick={() => handleAction(u.id, 'delete')}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title={t('admin.users.actions.delete')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
