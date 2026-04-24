import React from 'react';
import { User as UserIcon, Mail, Shield, Building2, Bell, LogOut, Star, ArrowRight } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';

export default function Profile() {
  const { user, plan, role, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            {t('profile.title')}
            {role === 'admin' && (
              <span className="text-xs bg-red-600 text-white px-3 py-0.5 rounded-full uppercase tracking-widest font-black">Admin</span>
            )}
          </h1>
          <p className="text-gray-500">{t('profile.description')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="card p-8 text-center text-gray-900 overflow-hidden relative">
            {plan === 'premium' && (
              <div className="absolute top-0 right-0 p-4">
                <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
              </div>
            )}
            <div className="inline-block relative mb-6">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className={cn("w-24 h-24 rounded-2xl shadow-lg border-4 border-white", plan === 'premium' && "ring-4 ring-amber-100")} />
              ) : (
                <div className={cn(
                  "w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-bold border-4 border-white shadow-lg",
                  plan === 'premium' ? "bg-amber-50 text-amber-600 ring-4 ring-amber-100" : "bg-red-50 text-red-600"
                )}>
                  {user?.displayName?.[0] || user?.email?.[0].toUpperCase()}
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold mb-1">{user?.displayName || 'Property Manager'}</h2>
            <p className="text-sm text-gray-500 mb-6">{user?.email}</p>
            
            <div className="flex flex-col gap-2">
              <div className={cn(
                "inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                plan === 'premium' ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
              )}>
                {plan === 'premium' ? <Star className="w-3 h-3 fill-amber-700" /> : <Shield className="w-3 h-3" />}
                {plan === 'premium' ? t('common.premium') : t('common.free')}
              </div>

              {plan === 'free' && (
                <button 
                  onClick={() => navigate('/membership')}
                  className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-amber-600 hover:text-amber-700 transition-colors group"
                >
                  {t('common.upgrade')}
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="card">
            <div className="p-6 border-b border-gray-100 font-bold text-gray-900">{t('profile.personal_info')}</div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">{t('profile.name_label')}</label>
                  <p className="text-sm text-gray-900 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">{user?.displayName || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">{t('profile.email_label')}</label>
                  <p className="text-sm text-gray-900 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="p-6 border-b border-gray-100 font-bold text-gray-900">{t('profile.security')}</div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg"><Bell className="w-4 h-4 text-gray-600" /></div>
                  <div>
                    <p className="text-sm font-medium">{t('profile.notifications')}</p>
                    <p className="text-xs text-gray-500">{t('profile.notifications_desc')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={logout}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
              {t('nav.logout')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
