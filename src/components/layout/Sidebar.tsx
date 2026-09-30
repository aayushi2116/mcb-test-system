import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  PlaySquare,
  History,
  BookOpen,
  Compass,
  CheckCheck,
  FileText,
  Settings,
  Activity,
  Zap,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useSystemStore } from '../../store/systemStore';

export const Sidebar: React.FC = () => {
  const { hardwareStatus, sidebarExpanded, mobileDrawerOpen, setMobileDrawerOpen, toggleSidebar } = useSystemStore();
  const location = useLocation();

  // Close mobile drawer on route change
  useEffect(() => {
    if (mobileDrawerOpen) {
      setMobileDrawerOpen(false);
    }
  }, [location.pathname]);

  const navItems = [
    { to: '/dashboard', label: 'Home', icon: Home },
    { to: '/new-test', label: 'New Test', icon: PlaySquare },
    { to: '/test-history', label: 'Test History', icon: History },
    { to: '/test-recipes', label: 'Test Recipes', icon: BookOpen },
    { to: '/calibration', label: 'Calibration', icon: Compass },
    { to: '/cvu-verification', label: 'CVU Verification', icon: CheckCheck },
    { to: '/reports', label: 'Reports', icon: FileText },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  // Precise route matching so only the actual current route is highlighted
  const isItemActive = (to: string) => {
    if (to === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    if (to === '/new-test') {
      return (
        location.pathname === '/new-test' ||
        (location.pathname.startsWith('/new-test/') && !location.pathname.startsWith('/new-test/results'))
      );
    }
    if (to === '/reports') {
      return location.pathname === '/reports' || location.pathname === '/new-test/results';
    }
    return location.pathname === to;
  };

  const handleNavClick = () => {
    if (mobileDrawerOpen) {
      setMobileDrawerOpen(false);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full w-full bg-white text-slate-700 select-none overflow-hidden">
      {/* 1. Brand Header (approx 50px) */}
      <div
        className={clsx(
          'h-[50px] border-b border-slate-200 flex items-center transition-all duration-200 flex-shrink-0',
          sidebarExpanded ? 'px-4 gap-2.5' : 'justify-center px-0'
        )}
      >
        <div className="w-7.5 h-7.5 rounded-md bg-teal-600 flex items-center justify-center text-white shadow-xs flex-shrink-0">
          <Zap className="w-4 h-4 fill-white" />
        </div>
        {sidebarExpanded && (
          <div className="min-w-0 flex-1">
            <div className="font-bold text-xs tracking-wider text-slate-900 leading-tight uppercase font-mono">
              MCB TEST
            </div>
            <div className="text-[10px] text-teal-700 font-semibold tracking-wide">
              IEC 60898-1 LAB
            </div>
          </div>
        )}
        {mobileDrawerOpen && (
          <button
            onClick={() => setMobileDrawerOpen(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-md ml-auto"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 2. Menu Icon Row (approx 40px) */}
      <div
        className={clsx(
          'h-10 border-b border-slate-200 flex items-center transition-all duration-200 flex-shrink-0',
          sidebarExpanded ? 'px-4 justify-start' : 'justify-center px-0'
        )}
      >
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          title={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          className="p-1 -ml-1 rounded hover:bg-slate-100 text-slate-800 transition-colors cursor-pointer flex items-center justify-center focus:outline-hidden"
        >
          {/* Three equal horizontal dark lines */}
          <svg
            className="w-5 h-5 text-slate-800"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {/* 3. Section Label */}
      {sidebarExpanded && (
        <div className="px-4 pt-2.5 pb-0.5 flex-shrink-0">
          <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest font-mono">
            CONSOLE CONTROL
          </span>
        </div>
      )}

      {/* 4. Navigation Links (flex: 1, min-height: 0, overflow: hidden, zero vertical scrollbar) */}
      <nav className={clsx('flex-1 min-h-0 py-1 space-y-0.5 overflow-hidden flex flex-col justify-start', sidebarExpanded ? 'px-2.5' : 'px-2')}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleNavClick}
              title={!sidebarExpanded ? item.label : undefined}
              className={clsx(
                'flex items-center rounded text-xs transition-colors group relative flex-shrink-0',
                sidebarExpanded ? 'px-2.5 py-1.5 gap-2.5' : 'p-2 justify-center',
                active
                  ? 'bg-teal-50 text-teal-900 font-semibold border-l-3 border-teal-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
              )}
            >
              <Icon
                className={clsx(
                  'w-4 h-4 flex-shrink-0 transition-colors',
                  active ? 'text-teal-600' : 'text-slate-500 group-hover:text-slate-800'
                )}
              />
              {sidebarExpanded && (
                <span className="truncate flex-1 text-xs font-medium text-slate-800 leading-normal">{item.label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* 5. Bottom Hardware Status Footer (flex-shrink: 0, pinned at bottom) */}
      <div
        className={clsx(
          'mt-auto border-t border-slate-200 bg-slate-50 text-[10px] font-mono flex-shrink-0 transition-all duration-200',
          sidebarExpanded ? 'p-2.5 space-y-1' : 'p-2 flex flex-col items-center space-y-1.5'
        )}
      >
        {sidebarExpanded ? (
          <>
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span className="font-semibold text-slate-600">PLC LINK</span>
              <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {hardwareStatus.plcConnected ? 'CONNECTED' : 'OFFLINE'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500">
              <span className="font-semibold text-slate-600">DAQ CORE</span>
              <span className="flex items-center gap-1.5 text-teal-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                1 MS/s
              </span>
            </div>
          </>
        ) : (
          <>
            <span
              className={clsx('w-2 h-2 rounded-full', hardwareStatus.plcConnected ? 'bg-emerald-500' : 'bg-red-500')}
              title={hardwareStatus.plcConnected ? 'PLC: CONNECTED' : 'PLC: OFFLINE'}
            />
            <span
              className="w-2 h-2 rounded-full bg-teal-500"
              title="DAQ CORE: 1 MS/s"
            />
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop / Tablet Sidebar: Exact 240px expanded, 72px collapsed, 100vh with overflow-hidden */}
      <aside
        style={{
          width: sidebarExpanded ? 240 : 72,
          minWidth: sidebarExpanded ? 240 : 72,
          maxWidth: sidebarExpanded ? 240 : 72,
        }}
        className={clsx(
          'hidden md:flex flex-col flex-shrink-0 h-screen border-r border-slate-200 bg-white transition-all duration-200 ease-in-out overflow-hidden',
          sidebarExpanded ? 'w-[240px]' : 'w-[72px]'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Off-Canvas Drawer */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />
          {/* Drawer container */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl z-50 h-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
