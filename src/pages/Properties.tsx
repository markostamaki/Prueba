import React, { useState } from 'react';
import { Building2, Plus, Search, MapPin, MoreVertical, Edit2, Trash2, X } from 'lucide-react';
import { useCollection, addRecord, deleteRecord, updateRecord } from '../hooks/useFirestore';
import { useAuth } from '../lib/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';

export default function Properties() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { data: properties, loading } = useCollection<any>('properties');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProperty, setEditingProperty] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    type: 'Apartment',
    monthlyRent: '',
    status: 'vacant',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const propertyData = {
      ...formData,
      ownerId: user.id,
      monthlyRent: Number(formData.monthlyRent)
    };

    if (editingProperty) {
      await updateRecord('properties', editingProperty.id, propertyData);
    } else {
      await addRecord('properties', propertyData);
    }

    setIsAddModalOpen(false);
    setEditingProperty(null);
    setFormData({ name: '', address: '', type: 'Apartment', monthlyRent: '', status: 'vacant', notes: '' });
  };

  const handleEdit = (prop: any) => {
    setEditingProperty(prop);
    setFormData({
      name: prop.name,
      address: prop.address,
      type: prop.type,
      monthlyRent: prop.monthlyRent.toString(),
      status: prop.status,
      notes: prop.notes || ''
    });
    setIsAddModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('common.confirm_delete') || 'Are you sure?')) {
      await deleteRecord('properties', id);
    }
  };

  const filteredProperties = properties.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{t('properties.title')}</h1>
          <p className="text-gray-500">{t('properties.title')}</p>
        </div>
        <button onClick={() => { setEditingProperty(null); setIsAddModalOpen(true); }} className="btn-primary">
          <Plus className="w-4 h-4" />
          {t('properties.add_property')}
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder={t('common.search') + "..."}
          className="input pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center text-gray-400">{t('common.loading')}</div>
        ) : filteredProperties.length === 0 ? (
          <div className="col-span-full py-20 text-center text-gray-400">{t('properties.no_properties')}</div>
        ) : (
          filteredProperties.map((prop) => (
            <motion.div
              layout
              key={prop.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card group hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-red-50 text-red-600 p-2 rounded-lg">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(prop)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(prop.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{prop.name}</h3>
                <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{prop.address}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold">{t('expenses.amount')}</p>
                    <p className="font-bold text-red-600">${prop.monthlyRent.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold">{t('properties.status')}</p>
                    <span className={cn(
                      "inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase mt-1",
                      prop.status === 'occupied' ? 'bg-green-50 text-green-600' : 
                      prop.status === 'maintenance' ? 'bg-orange-50 text-orange-600' : 'bg-gray-100 text-gray-600'
                    )}>
                      {prop.status}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold">{editingProperty ? t('properties.edit_property') : t('properties.add_property')}</h2>
                <button onClick={() => setIsAddModalOpen(false)}><X className="w-6 h-6 text-gray-400" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('properties.name')}</label>
                    <input
                      required
                      type="text"
                      className="input"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Sunset Heights"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('properties.address')}</label>
                    <input
                      required
                      type="text"
                      className="input"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="123 Main St, City, State"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('properties.type')}</label>
                      <select
                        className="input"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      >
                        <option>Apartment</option>
                        <option>House</option>
                        <option>Condo</option>
                        <option>Commercial</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('expenses.amount')} ($)</label>
                      <input
                        required
                        type="number"
                        className="input"
                        value={formData.monthlyRent}
                        onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('properties.status')}</label>
                    <div className="flex gap-2">
                      {['vacant', 'occupied', 'maintenance'].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setFormData({ ...formData, status: s })}
                          className={cn(
                            "flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase transition-all",
                            formData.status === s 
                              ? "bg-red-600 text-white" 
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('expenses.description')} ({t('common.locked')})</label>
                    <textarea
                      className="input min-h-[100px]"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors">
                    {t('common.cancel')}
                  </button>
                  <button type="submit" className="flex-[2] btn-primary py-3 rounded-xl">
                    {editingProperty ? t('common.save') : t('common.add')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
