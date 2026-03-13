import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const links = [
    { to: '/dashboard', icon: '🏠', label: 'Home' },
    { to: '/quests', icon: '⚔️', label: 'Quests' },
    { to: '/skills', icon: '🧠', label: 'Skills' },
    { to: '/profile', icon: '👤', label: 'Profile' },
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
              Spider-Verse Quest
            </span>
          </NavLink>

          <div className="flex items-center gap-1">
            {links.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `nav-link flex items-center gap-2 text-sm font-medium ${isActive ? 'active' : ''}`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
              style={{ background: 'var(--color-verse-panel)', border: '1px solid var(--color-verse-border)' }}>
              <span>⚡</span>
              <span className="font-semibold" style={{ color: 'var(--color-spider-gold)' }}>Lv.{user?.level || 1}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm px-4 py-2 rounded-lg font-medium transition-all hover:bg-red-500/10"
              style={{ color: 'var(--color-verse-muted)' }}
            >
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
              SpiderVerse
            </span>
          </NavLink>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
              style={{ background: 'var(--color-verse-panel)', border: '1px solid var(--color-verse-border)' }}>
              <span>⚡</span>
              <span className="font-semibold" style={{ color: 'var(--color-spider-gold)' }}>Lv.{user?.level || 1}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
              style={{ color: 'var(--color-verse-muted)', background: 'var(--color-verse-panel)' }}
            >
              ↪️
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 mobile-bottom-bar">
        <div className="flex items-center justify-around h-16 px-2">
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `mobile-tab-link flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all ${isActive ? 'active' : ''}`
              }
            >
              <span className="text-xl leading-none">{link.icon}</span>
              <span className="text-[10px] font-medium leading-none">{link.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
