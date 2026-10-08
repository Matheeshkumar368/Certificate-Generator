import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Award,
  Layers,
  FileCheck2,
  X,
  ChevronRight,
  GraduationCap
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Generate Certificates', path: '/generate', icon: Award },
    { label: 'My Jobs', path: '/jobs', icon: Layers },
    { label: 'Templates', path: '/templates', icon: FileCheck2 },
  ];

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
        <NavLink to="/" className="flex items-center gap-3 group" onClick={() => setMobileOpen(false)}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <GraduationCap className="w-5 h-5 transition-transform group-hover:scale-110" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-900 tracking-tight leading-tight">
              Aereo Learning
            </div>
            <div className="text-xs text-indigo-600 font-medium">CertificateFlow</div>
          </div>
        </NavLink>

        {/* Mobile close */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50/80 text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Profile Bar */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100/80">
          <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-semibold flex items-center justify-center text-sm shadow-xs">
            M
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-900 truncate leading-tight">
              Matheesh Kumar
            </div>
            <div className="text-xs text-slate-500 font-normal">Student</div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop permanent sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 fixed inset-y-0 left-0 z-30">
        {content}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 w-72 z-50 transform transition-transform duration-200 ease-in-out md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {content}
      </div>
    </>
  );
};
