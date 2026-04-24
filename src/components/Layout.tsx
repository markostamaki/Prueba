import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building2, Receipt, Wrench, User, LogOut, Menu, X, Star, CreditCard, Lock, Shield } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';

export default function Layout() {
  const { logout, user, plan, role } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/dashboard' },
    { icon: Building2, label: t('nav.properties'), path: '/properties' },
    { icon: Receipt, label: t('nav.expenses'), path: '/expenses' },
    { icon: Wrench, label: t('nav.maintenance'), path: '/maintenance', premium: true },
    { icon: CreditCard, label: t('nav.membership'), path: '/membership' },
    { icon: User, label: t('nav.profile'), path: '/profile' },
  ];

  if (role === 'admin') {
    menuItems.push({ icon: Shield, label: t('admin.title'), path: '/admin' });
  }

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 fixed h-full z-30">
        <div className="p-6">
          <div className="flex items-center gap-2 text-red-600 font-bold text-xl uppercase tracking-wider">
            <Building2 className="w-8 h-8" />
            <span>SHINIGAMI</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-red-50 text-red-600" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5" />
                {item.label}
              </div>
              {item.premium && plan === 'free' && (
                <Lock className="w-3.5 h-3.5 text-gray-400" />
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="mb-4 px-4">
             {plan === 'premium' ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-full w-fit">
                  <Star className="w-3 h-3 fill-amber-600" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{t('common.premium')}</span>
                </div>
              ) : (
                <div className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full w-fit">
                  <span className="text-[10px] font-bold uppercase tracking-widest">{t('common.free_version')}</span>
                </div>
              )}
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold">
                {user?.displayName?.[0] || user?.email?.[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate flex items-center gap-1">
                {user?.displayName || 'User'}
                {plan === 'premium' && <Star className="w-3 h-3 fill-amber-500 text-amber-500" />}
                {role === 'admin' && <Shield className="w-3 h-3 text-red-600" />}
              </p>
              <div className="flex items-center gap-1">
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                {role === 'admin' && (
                  <span className="text-[9px] font-black text-red-600 bg-red-50 px-1 rounded uppercase tracking-tighter border border-red-100">Admin</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-2 flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      {/* Mobile Nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2 text-red-600 font-bold text-lg uppercase">
          <Building2 className="w-6 h-6" />
          <span>SHINIGAMI</span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <button onClick={() => setIsMobileMenuOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-50 md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed inset-y-0 left-0 w-72 bg-white z-50 md:hidden flex flex-col"
            >
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-600 font-bold text-xl uppercase">
                  <Building2 className="w-8 h-8" />
                  <span>SHINIGAMI</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="flex-1 px-4 space-y-1">
                <div className="px-4 py-2">
                   {plan === 'premium' ? (
                      <div className="flex items-center gap-2 px-2 py-1 bg-amber-50 text-amber-600 rounded-lg mb-2">
                        <Star className="w-3 h-3 fill-amber-600" />
                        <span className="text-[10px] font-bold uppercase">{t('common.premium')}</span>
                      </div>
                    ) : (
                      <div className="px-2 py-1 bg-gray-100 text-gray-500 rounded-lg mb-2">
                        <span className="text-[10px] font-bold uppercase">{t('common.free_version')}</span>
                      </div>
                    )}
                </div>
                {menuItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                        isActive 
                          ? "bg-red-50 text-red-600" 
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )
                    }
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </div>
                    {item.premium && plan === 'free' && <Lock className="w-3.5 h-3.5 text-gray-400" />}
                  </NavLink>
                ))}
              </nav>
              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  {t('nav.logout')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 relative min-h-screen">
        <header className="sticky top-0 right-0 left-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 hidden md:flex items-center justify-end px-8 z-20">
          <LanguageSelector />
        </header>

        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
