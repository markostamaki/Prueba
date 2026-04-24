import React, { useState } from 'react';
import { Wrench, Plus, Calendar, Clock, CheckCircle2, ChevronRight, X, AlertTriangle, Building2, Lock, Star } from 'lucide-react';
import { useCollection, addRecord, updateRecord, deleteRecord } from '../hooks/useFirestore';
import { useAuth } from '../lib/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { format, isPast, isToday } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Maintenance() {
  const { user, plan, language } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: tasks, loading } = useCollection<any>('maintenance_tasks', [], plan === 'premium');
  const { data: properties } = useCollection<any>('properties');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const locale = language.startsWith('es') ? es : enUS;
  const dateFormat = language.startsWith('es') ? 'dd/MM/yyyy' : 'MMM d, yyyy';

  if (plan === 'free') {
    return (
      <div className="flex items-center justify-center min-h-[70vh] p-4 text-center">
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="max-w-md bg-white card p-10 border-2 border-amber-100"
        >
          <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2 uppercase tracking-tight">{t('maintenance.premium_feature')}</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            {t('maintenance.premium_desc')}
          </p>
          <button 
            onClick={() => navigate('/membership')}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-100 uppercase tracking-widest text-sm"
          >
            <Star className="w-5 h-5 fill-white" />
            {t('common.upgrade')}
          </button>
          <button 
            onClick={() => navigate('/dashboard')}
            className="mt-4 text-gray-400 text-xs font-bold uppercase tracking-widest hover:text-gray-600 transition-colors"
          >
            {t('common.back')}
          </button>
        </motion.div>
      </div>
    );
  }

  const [formData, setFormData] = useState({
    title: '',
    propertyId: '',
    scheduledDate: format(new Date(), 'yyyy-MM-dd'),
    priority: 'medium',
    status: 'pending',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    await addRecord('maintenance_tasks', {
      ...formData,
      userId: user.id
    });

    setIsModalOpen(false);
    setFormData({
      title: '',
      propertyId: '',
      scheduledDate: format(new Date(), 'yyyy-MM-dd'),
      priority: 'medium',
      status: 'pending',
      description: ''
    });
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    await updateRecord('maintenance_tasks', taskId, { status: newStatus });
  };

  const sortedTasks = [...tasks].sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{t('maintenance.title')}</h1>
          <p className="text-gray-500">{t('maintenance.no_tasks')}</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          {t('maintenance.add_task')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Task List */}
        <div className="md:col-span-2 space-y-4">
          {loading ? (
            <div className="py-20 text-center text-gray-400">{t('common.loading')}</div>
          ) : tasks.length === 0 ? (
            <div className="card p-12 text-center text-gray-400">
              <Wrench className="w-12 h-12 mx-auto mb-4 opacity-10" />
              <p>{t('maintenance.no_tasks')}</p>
            </div>
          ) : (
            sortedTasks.map((task) => (
              <motion.div
                layout
                key={task.id}
                className={cn(
                  "card p-6 border-l-4",
                  task.status === 'completed' ? 'border-l-green-500' :
                  task.priority === 'high' ? 'border-l-red-500' :
                  task.priority === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={cn("font-bold text-lg", task.status === 'completed' && "line-through text-gray-400")}>
                        {task.title}
                      </h3>
                      {isPast(new Date(task.scheduledDate)) && !isToday(new Date(task.scheduledDate)) && task.status !== 'completed' && (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(task.scheduledDate), dateFormat, { locale })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {properties.find(p => p.id === task.propertyId)?.name || 'Unknown Property'}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2 italic">{task.description}</p>
                  </div>
                  <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                      className={cn(
                        "text-[10px] font-bold uppercase py-1 px-3 rounded-full outline-none border transition-colors cursor-pointer",
                        task.status === 'completed' ? 'bg-green-50 text-green-600 border-green-100' :
                        task.status === 'in_progress' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-100 text-gray-600 border-gray-200'
                      )}
                    >
                      <option value="pending">{t('maintenance.status.pending')}</option>
                      <option value="in_progress">{t('maintenance.status.in_progress')}</option>
                      <option value="completed">{t('maintenance.status.completed')}</option>
                    </select>
                    <button onClick={() => deleteRecord('maintenance_tasks', task.id)} className="p-2 text-gray-300 hover:text-red-600 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Calendar Stats Sidebar */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-600" />
              {t('common.actions')}
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">{t('dashboard.pending_tasks')}</span>
                <span className="font-bold text-gray-900">{tasks.filter(t => t.status !== 'completed').length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">{t('maintenance.priority.high')}</span>
                <span className="font-bold text-red-600">
                  {tasks.filter(t => t.status !== 'completed' && isPast(new Date(t.scheduledDate)) && !isToday(new Date(t.scheduledDate))).length}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">{t('maintenance.status.completed')}</span>
                <span className="font-bold text-green-600">{tasks.filter(t => t.status === 'completed').length}</span>
              </div>
            </div>
          </div>
          
          <div className="card bg-gray-900 p-6 text-white">
            <p className="text-red-500 font-bold text-xs uppercase tracking-widest mb-1">{t('common.premium')}</p>
            <h3 className="text-xl font-bold leading-tight">{t('maintenance.title')}</h3>
            <p className="text-gray-400 text-sm mt-2 font-mono italic">"{t('auth.tagline')}"</p>
          </div>
        </div>
      </div>

       {/* Add Modal */}
       <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold">{t('maintenance.add_task')}</h2>
                <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6 text-gray-400" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('maintenance.add_task')}</label>
                  <input
                    required
                    type="text"
                    className="input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Annual HVAC Inspection"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('expenses.property')}</label>
                  <select
                    required
                    className="input"
                    value={formData.propertyId}
                    onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                  >
                    <option value="">{t('common.search')}</option>
                    {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('expenses.date')}</label>
                    <input
                      required
                      type="date"
                      className="input"
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('maintenance.priority.medium')}</label>
                    <select
                      className="input"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    >
                      <option value="low">{t('maintenance.priority.low')}</option>
                      <option value="medium">{t('maintenance.priority.medium')}</option>
                      <option value="high">{t('maintenance.priority.high')}</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('expenses.description')}</label>
                  <textarea
                    required
                    className="input min-h-[80px]"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Provide specific details about the required work..."
                  />
                </div>
                <button type="submit" className="w-full btn-primary py-3 rounded-xl">
                  {t('common.confirm')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
