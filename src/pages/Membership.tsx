import React from 'react';
import { Star, Check, ShieldCheck, Zap, ArrowRight, CreditCard } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';

export default function Membership() {
  const { plan, upgradePlan } = useAuth();
  const { t } = useTranslation();

  const plans = [
    {
      id: 'free',
      name: t('membership.free.name'),
      price: t('membership.free.price'),
      description: t('membership.free.period'),
      features: t('membership.free.features', { returnObjects: true }) as string[],
      restricted: [
        'Maintenance Scheduler',
        'Priority Tasking',
        'Upcoming Notifications'
      ]
    },
    {
      id: 'premium',
      name: t('membership.premium.name'),
      price: t('membership.premium.price'),
      description: t('membership.premium.period'),
      popular: true,
      features: t('membership.premium.features', { returnObjects: true }) as string[]
    }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight uppercase">{t('membership.title')}</h1>
        <p className="text-gray-500 max-w-xl mx-auto">{t('membership.choose_plan')}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-stretch mt-12">
        {plans.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "card relative flex flex-col p-8 transition-all h-full",
              p.popular ? "ring-2 ring-red-600 shadow-xl" : "shadow-sm border-gray-100",
              plan === p.id && "bg-gray-50"
            )}
          >
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                {p.name}
                {p.id === 'premium' && <Star className="w-5 h-5 fill-amber-500 text-amber-500" />}
              </h3>
              <p className="text-gray-500 text-sm mt-2">{p.description}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-bold text-gray-900">{p.price}</span>
                <span className="text-gray-400 font-medium">/{p.id === 'free' ? t('membership.free.period') : t('membership.premium.period')}</span>
              </div>
            </div>

            <div className="flex-1 space-y-4 mb-8 text-sm">
              <ul className="space-y-3">
                {p.features.map(f => (
                  <li key={f} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">{f}</span>
                  </li>
                ))}
                {p.restricted?.map(f => (
                  <li key={f} className="flex items-start gap-3 opacity-40">
                    <Check className="w-5 h-5 text-gray-300 flex-shrink-0" />
                    <span className="text-gray-400">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {plan === p.id ? (
              <button disabled className="w-full py-4 bg-gray-100 text-gray-400 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 cursor-not-allowed">
                <ShieldCheck className="w-4 h-4" />
                {t('membership.active_plan')}
              </button>
            ) : (
              <button
                onClick={() => upgradePlan(p.id as any)}
                className={cn(
                  "w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2",
                  p.popular 
                    ? "bg-red-600 text-white hover:bg-red-700 shadow-red-200 shadow-lg" 
                    : "bg-white border border-gray-200 text-gray-900 hover:bg-gray-50"
                )}
              >
                {p.id === 'free' ? t('membership.get_started') : t('membership.premium.name')}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
