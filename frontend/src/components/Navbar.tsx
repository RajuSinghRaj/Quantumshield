import React from 'react';
import { Shield, Sun, Moon, Zap } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isBackendHealthy: boolean;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isBackendHealthy,
  isDarkMode,
  setIsDarkMode,
}) => {
  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'scanner', label: 'Scan' },
    { id: 'dashboard', label: 'Reports' },
    { id: 'inventory', label: 'Algorithms' },
    { id: 'migration', label: 'PQC Center' },
    { id: 'education', label: 'Learn' },
    { id: 'history', label: 'Dashboard' },
  ];

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-purple-500/20 backdrop-blur-xl">
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center space-x-3.5 cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 p-0.5 shadow-lg shadow-purple-500/30 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Shield className="w-6 h-6 text-purple-400 group-hover:rotate-12 transition-transform" />
            </div>
          </div>
          <span className="font-extrabold text-2xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-400">
            QUANTUMSHIELD
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="hidden lg:flex items-center space-x-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all ${
                  isActive
                    ? 'bg-purple-600/15 text-purple-600 dark:text-purple-300 border border-purple-500/30 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center space-x-4">
          
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-3 rounded-full border border-purple-500/30 text-purple-600 dark:text-purple-300 hover:bg-purple-500/10 transition-colors"
            title="Toggle Light/Dark Theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Start New Scan CTA */}
          <button
            onClick={() => setActiveTab('scanner')}
            className="flex items-center space-x-2 px-6 py-3 rounded-full text-xs font-extrabold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all transform active:scale-95"
          >
            <span>Start New Scan</span>
            <Zap className="w-4 h-4 fill-current" />
          </button>

        </div>

      </div>
    </header>
  );
};
