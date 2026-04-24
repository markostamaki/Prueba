import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Shield, BarChart3, Clock, ChevronRight } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/LanguageSelector';

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-600 font-bold text-xl uppercase tracking-tighter">
            <Building2 className="w-8 h-8" />
            <span>SHINIGAMI</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <button
              onClick={() => navigate(user ? '/dashboard' : '/auth')}
              className="btn-primary"
            >
              {user ? t('nav.dashboard') : t('auth.login')}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              {t('landing.title')}
            </h1>
            <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
              {t('landing.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate(user ? '/dashboard' : '/auth')}
                className="btn-primary text-lg px-8 py-3"
              >
                {t('landing.cta')}
                <ChevronRight className="w-5 h-5" />
              </button>
              <button className="px-8 py-3 text-gray-600 font-medium hover:text-gray-900 transition-colors">
                {t('landing.demo')}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: t('landing.features.tracking.title'),
                desc: t('landing.features.tracking.desc')
              },
              {
                icon: BarChart3,
                title: t('landing.features.expenses.title'),
                desc: t('landing.features.expenses.desc')
              },
              {
                icon: Clock,
                title: t('landing.features.maintenance.title'),
                desc: t('landing.features.maintenance.desc')
              }
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="card p-8 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-lg flex items-center justify-center mb-6">
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 text-gray-400 font-bold text-xl uppercase mb-8">
            <Building2 className="w-8 h-8" />
            <span>SHINIGAMI HOUSE</span>
          </div>
          <p className="text-gray-400 text-sm">
            {t('landing.footer')}
          </p>
        </div>
      </footer>
    </div>
  );
}
