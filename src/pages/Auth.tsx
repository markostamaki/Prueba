import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Mail } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

export default function Auth() {
  const { loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
      >
        <div className="p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
              <Building2 className="w-10 h-10" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2 uppercase tracking-tight">{t('auth.login_title')}</h2>
          <p className="text-gray-500 mb-8">{t('auth.welcome_back')}</p>

          <div className="space-y-4">
            <button
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium text-gray-700"
            >
              <img src="https://www.google.com/favicon.ico" alt="" className="w-5 h-5" />
              {t('auth.continue_google')}
            </button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-100"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-400">Enterprise Access only</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              {t('auth.terms_agreement')} <br />
              <button className="underline hover:text-red-600">{t('auth.terms')}</button> and <button className="underline hover:text-red-600">{t('auth.privacy')}</button>
            </p>
          </div>
        </div>
        <div className="bg-red-600 p-4 text-center">
          <p className="text-white text-xs font-bold uppercase tracking-widest">{t('auth.tagline')}</p>
        </div>
      </motion.div>
    </div>
  );
}
