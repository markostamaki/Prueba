import React, { useState } from 'react';
import { Receipt, Plus, Search, Filter, Trash2, X, Download } from 'lucide-react';
import { useCollection, addRecord, deleteRecord } from '../hooks/useFirestore';
import { useAuth } from '../lib/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';

export default function Expenses() {
  const { user, language } = useAuth();
  const { t } = useTranslation();
  const { data: expenses, loading } = useCollection<any>('expenses');
  const { data: properties } = useCollection<any>('properties');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const locale = language.startsWith('es') ? es : enUS;
  const dateFormat = language.startsWith('es') ? 'dd/MM/yyyy' : 'MMM d, yyyy';

  const [formData, setFormData] = useState({
    propertyId: '',
    category: 'Repairs',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    description: ''
  });

  const categories = ['Repairs', 'Taxes', ' Insurance', 'Utilities', 'Management', 'Mortgage', 'Other'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    await addRecord('expenses', {
      ...formData,
      userId: user.uid,
      amount: Number(formData.amount)
    });

    setIsModalOpen(false);
    setFormData({
      propertyId: '',
      category: 'Repairs',
      amount: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      description: ''
    });
  };

  const filteredExpenses = expenses.filter(e => 
    e.category.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{t('expenses.title')}</h1>
          <p className="text-gray-500">{t('expenses.recent')}</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          {t('expenses.add_expense')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 bg-red-600 text-white md:col-span-1">
          <p className="text-red-100 text-xs font-bold uppercase tracking-widest mb-1">{t('expenses.recent')}</p>
          <p className="text-4xl font-bold">${totalExpenses.toLocaleString()}</p>
          <div className="mt-4 flex items-center justify-between text-xs text-red-100">
            <span>{filteredExpenses.length} {t('dashboard.pending_tasks')}</span>
            <Download className="w-4 h-4 cursor-pointer hover:text-white" />
          </div>
        </div>
        
        <div className="card p-6 md:col-span-2">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('common.search') + "..."}
                className="input pl-10 h-10 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="px-4 py-2 border border-gray-200 rounded-lg flex items-center justify-center gap-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              {t('common.search')}
            </button>
          </div>
        </div>
      </div>

      <div className="card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-widest border-b border-gray-100">
                <th className="px-6 py-4">{t('expenses.date')}</th>
                <th className="px-6 py-4">{t('expenses.property')}</th>
                <th className="px-6 py-4">{t('expenses.category')}</th>
                <th className="px-6 py-4">{t('expenses.description')}</th>
                <th className="px-6 py-4 text-right">{t('expenses.amount')}</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 italic">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400 not-italic">{t('common.loading')}</td></tr>
              ) : filteredExpenses.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400 not-italic">{t('expenses.no_expenses')}</td></tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50/50 transition-colors not-italic">
                    <td className="px-6 py-4 text-sm whitespace-nowrap">{format(new Date(exp.date), dateFormat, { locale })}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {properties.find(p => p.id === exp.propertyId)?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-red-50 text-red-600 rounded text-[10px] font-bold uppercase">
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{exp.description}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                      ${Number(exp.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => deleteRecord('expenses', exp.id)} className="text-gray-300 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
                <h2 className="text-xl font-bold">{t('expenses.add_expense')}</h2>
                <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6 text-gray-400" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('expenses.category')}</label>
                    <select
                      className="input"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {categories.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('expenses.amount')} ($)</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      className="input"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('expenses.date')}</label>
                  <input
                    required
                    type="date"
                    className="input"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('expenses.description')}</label>
                  <textarea
                    required
                    className="input min-h-[80px]"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g. Broken pipe in kitchen"
                  />
                </div>
                <button type="submit" className="w-full btn-primary py-3 rounded-xl">
                  {t('common.save')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
