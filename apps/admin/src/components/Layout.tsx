import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import {
  LayoutDashboard,
  Link2,
  PlusCircle,
  ArrowLeftRight,
  Tags,
  Settings,
  LogOut,
  ScrollText,
} from 'lucide-react';
import clsx from 'clsx';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/links', icon: Link2, label: 'Links', end: false },
  { to: '/links/create', icon: PlusCircle, label: 'Create Link', end: true },
  { to: '/import-export', icon: ArrowLeftRight, label: 'Import / Export', end: true },
  { to: '/tags', icon: Tags, label: 'Tags', end: true },
  { to: '/settings', icon: Settings, label: 'Settings', end: true },
  { to: '/audit-logs', icon: ScrollText, label: 'Audit Logs', end: true },
];

export default function Layout() {
  const { setAuthenticated } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem('linkora_token');
    setAuthenticated(false);
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col border-r border-slate-800 bg-slate-900">
        <div className="flex h-14 items-center gap-2 border-b border-slate-800 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <Link2 className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold text-white">Linkora</span>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2 scrollbar-thin">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-600/20 text-brand-400'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                )
              }
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-800 p-2">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-slate-950 p-6 scrollbar-thin">
        <Outlet />
      </main>
    </div>
  );
}
