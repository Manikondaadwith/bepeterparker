import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Home, Swords, Brain, User, Zap, Flame, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const links = [
    { to: '/dashboard', icon: Home, label: 'Home' },
    { to: '/quests', icon: Swords, label: 'Quests' },
    { to: '/skills', icon: Brain, label: 'Skills' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <>
      {/* ── Desktop top bar (hidden on mobile) ── */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="hidden md:block fixed top-0 left-0 right-0 z-50"
        style={{
          background: 'linear-gradient(180deg, rgba(5,5,16,0.95), rgba(5,5,16,0.8))',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--color-verse-border)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <NavLink to="/dashboard" className="flex items-center gap-3 group">
            <span className="text-2xl group-hover:animate-bounce">🕷️</span>
            <span className="font-bold text-lg" style={{
              background: 'linear-gradient(135deg, var(--color-spider-red), var(--color-spider-red-light))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              BePeterParker
            </span>
          </NavLink>

          <div className="flex items-center gap-1">
            {links.map(link => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) => `nav-link flex items-center gap-2 text-sm font-medium ${isActive ? 'active' : ''}`}
                >
                  <Icon size={16} strokeWidth={2} />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
              style={{ background: 'var(--color-verse-panel)', border: '1px solid var(--color-verse-border)' }}>
              <Zap size={14} style={{ color: 'var(--color-spider-gold)' }} />
              <span className="font-semibold" style={{ color: 'var(--color-spider-gold)' }}>Lv.{user?.level || 1}</span>
              {user?.streak > 0 && (
                <>
                  <span className="ml-1 text-xs" style={{ color: 'var(--color-verse-border)' }}>|</span>
                  <Flame size={14} className="ml-1 streak-fire" style={{ color: 'var(--color-boss-orange)' }} />
                  <span className="font-bold text-xs" style={{ color: 'var(--color-boss-orange)' }}>{user.streak}d</span>
                </>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-medium transition-all hover:bg-red-500/10"
              style={{ color: 'var(--color-verse-muted)' }}
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ── Mobile top header (visible only on mobile) ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 mobile-top-bar">
        <div className="flex items-center justify-between px-4 h-14">
          <NavLink to="/dashboard" className="flex items-center gap-2">
            <span className="text-xl">🕷️</span>
            <span className="font-bold text-sm" style={{
              background: 'linear-gradient(135deg, var(--color-spider-red), var(--color-spider-red-light))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              BePeterParker
            </span>
          </NavLink>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
              style={{ background: 'var(--color-verse-panel)', border: '1px solid var(--color-verse-border)' }}>
              <Zap size={12} style={{ color: 'var(--color-spider-gold)' }} />
              <span className="font-semibold" style={{ color: 'var(--color-spider-gold)' }}>Lv.{user?.level || 1}</span>
              {user?.streak > 0 && (
                <>
                  <span className="ml-0.5 text-[10px]" style={{ color: 'var(--color-verse-border)' }}>|</span>
                  <Flame size={10} className="ml-0.5 streak-fire" style={{ color: 'var(--color-boss-orange)' }} />
                  <span className="font-bold text-[10px]" style={{ color: 'var(--color-boss-orange)' }}>{user.streak}d</span>
                </>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="text-xs p-1.5 rounded-lg font-medium transition-all"
              style={{ color: 'var(--color-verse-muted)', background: 'var(--color-verse-panel)' }}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 mobile-bottom-bar">
        <div className="flex items-center justify-around h-16 px-2">
          {links.map(link => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `mobile-tab-link flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all ${isActive ? 'active' : ''}`
                }
              >
                <Icon size={20} strokeWidth={2} />
                <span className="text-[10px] font-medium leading-none">{link.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
}
