import React from 'react';
import { Building2, Receipt, Wrench, AlertCircle, TrendingUp, Plus, Lock, Star } from 'lucide-react';
import { useCollection } from '../hooks/useFirestore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const navigate = useNavigate();
  const { plan, language } = useAuth();
  const { t } = useTranslation();
  const { data: properties } = useCollection<any>('properties');
  const { data: expenses } = useCollection<any>('expenses');
  const { data: tasks } = useCollection<any>('maintenance_tasks', [], plan === 'premium');

  const locale = language.startsWith('es') ? es : enUS;
  const dateFormat = language.startsWith('es') ? 'dd/MM/yyyy' : 'MMM d, yyyy';

  const totalMonthlyExpenses = expenses
    .filter(e => {
      const date = new Date(e.date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const underMaintenance = properties.filter(p => p.status === 'maintenance');

  const stats = [
    { label: t('dashboard.total_properties'), value: properties.length, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: t('dashboard.monthly_expenses'), value: `$${totalMonthlyExpenses.toLocaleString()}`, icon: Receipt, color: 'text-red-600', bg: 'bg-red-50' },
    { label: t('dashboard.pending_tasks'), value: plan === 'premium' ? pendingTasks.length : t('common.locked'), icon: Wrench, color: 'text-yellow-600', bg: 'bg-yellow-50', premium: true },
    { label: t('dashboard.under_maintenance'), value: plan === 'premium' ? underMaintenance.length : t('common.locked'), icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50', premium: true },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-gray-500">{t('auth.welcome')}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/properties')} className="btn-primary">
            <Plus className="w-4 h-4" />
            {t('properties.add_property')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "card p-6", 
              stat.premium && plan === 'free' && "opacity-60 grayscale border-dashed cursor-pointer hover:bg-gray-50"
            )}
            onClick={() => stat.premium && plan === 'free' && navigate('/membership')}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              {stat.premium && plan === 'free' ? (
                <Lock className="w-3.5 h-3.5 text-gray-400" />
              ) : (
                <TrendingUp className="w-4 h-4 text-green-500" />
              )}
            </div>
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Expenses */}
        <div className="card">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">{t('dashboard.recent_expenses')}</h2>
            <button onClick={() => navigate('/expenses')} className="text-sm text-red-600 font-medium hover:underline">
              {t('dashboard.view_all')}
            </button>
          </div>
          <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
            {expenses.length === 0 ? (
              <p className="p-8 text-center text-gray-400">{t('expenses.no_expenses')}</p>
            ) : (
              expenses.slice(0, 5).map((exp) => (
                <div key={exp.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">{exp.category}</p>
                    <p className="text-xs text-gray-500">{format(new Date(exp.date), dateFormat, { locale })} • {exp.description}</p>
                  </div>
                  <p className="font-bold text-red-600">-${Number(exp.amount).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Maintenance */}
        <div className={cn("card overflow-hidden", plan === 'free' && "opacity-80 bg-gray-50")}>
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              {t('dashboard.maintenance_schedule')}
              {plan === 'free' && <Lock className="w-4 h-4 text-gray-400" />}
            </h2>
            {plan === 'premium' && (
              <button onClick={() => navigate('/maintenance')} className="text-sm text-red-600 font-medium hover:underline">
                {t('dashboard.manage')}
              </button>
            )}
          </div>
          {plan === 'free' ? (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center">
               <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4 scale-75">
                 <Star className="w-6 h-6 fill-amber-600" />
               </div>
               <p className="text-xs font-bold uppercase tracking-widest mb-4">{t('dashboard.unlock_scheduler')}</p>
               <button 
                onClick={() => navigate('/membership')}
                className="text-[10px] bg-amber-500 text-white px-4 py-2 rounded-lg font-bold uppercase tracking-widest transition-all hover:bg-amber-600"
               >
                 {t('maintenance.upgrade_now')}
               </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
              {tasks.length === 0 ? (
                <p className="p-8 text-center text-gray-400">{t('dashboard.clear_schedule')}</p>
              ) : (
                tasks.filter(t => t.status !== 'completed').slice(0, 5).map((task) => (
                  <div key={task.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                    <div className={cn(
                      "w-2 h-10 rounded-full",
                      task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                    )} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{task.title}</p>
                      <p className="text-xs text-gray-500">{format(new Date(task.scheduledDate), dateFormat, { locale })} • {t(`maintenance.priority.${task.priority}`)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
