import React from 'react';
import { Menu, Plus } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const location = useLocation();

  const getPageTitle = () => {
    if (location.pathname === '/') return 'Dashboard';
    if (location.pathname.startsWith('/generate')) return 'Generate Certificates';
    if (location.pathname.startsWith('/jobs/') && location.pathname !== '/jobs') return 'Job Details';
    if (location.pathname === '/jobs') return 'My Jobs';
    if (location.pathname === '/templates') return 'Templates';
    return 'CertificateFlow';
  };

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="font-medium text-slate-900">{getPageTitle()}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {location.pathname !== '/generate' && (
          <Link
            to="/generate"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs shadow-indigo-200 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Certificates</span>
          </Link>
        )}
      </div>
    </header>
  );
};
