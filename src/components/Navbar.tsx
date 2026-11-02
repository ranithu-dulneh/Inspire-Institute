import React, { useState } from 'react';
import { ActiveTab, CurrentUser } from '../types';
import { InspireLogo } from './InspireLogo';
import { 
  Menu, 
  X, 
  ChevronDown, 
  LogOut, 
  LayoutDashboard, 
  Search,
  ShoppingBag,
  Award,
  Sparkles,
  FileText,
  Video,
  Building2,
  GraduationCap,
  ShieldCheck,
  Radio
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  currentUser: CurrentUser | null;
  onOpenSearch: () => void;
  onOpenCart: () => void;
  cartCount: number;
  onOpenSignUp: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onNavigate,
  currentUser,
  onOpenSearch,
  onOpenCart,
  cartCount,
  onOpenSignUp,
  onOpenLogin,
  onLogout
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);

  // Primary Navigation Links across the platform
  // When inside the LMS, remove Past Papers, Video Modules, and Study Materials from the top navbar 
  // because they are already in the LMS left navigation bar.
  const isInsideLMS = activeTab === 'lms';
  const isAdmin = currentUser?.role === 'Admin';

  const mainNavLinks: { id: ActiveTab; label: string; icon?: React.FC<{ className?: string }> }[] = isAdmin
    ? [
        { id: 'admin', label: 'Admin Panel', icon: ShieldCheck },
        { id: 'home', label: 'Public Home', icon: LayoutDashboard },
        { id: 'live', label: 'Live Classes', icon: Radio },
        { id: 'lms', label: 'LMS View', icon: Sparkles },
        { id: 'past-papers', label: 'Past Papers', icon: FileText },
        { id: 'videos', label: 'Lesson Modules', icon: Video },
        { id: 'store', label: 'Study Store', icon: ShoppingBag }
      ]
    : isInsideLMS
    ? [
        { id: 'home', label: 'Overview', icon: LayoutDashboard },
        { id: 'live', label: 'Live Classes', icon: Radio },
        { id: 'lms', label: 'LMS Dashboard', icon: Sparkles },
        { id: 'results', label: 'Wall of Fame', icon: Award }
      ]
    : [
        { id: 'home', label: 'Overview', icon: LayoutDashboard },
        { id: 'live', label: 'Live Classes', icon: Radio },
        { id: 'past-papers', label: 'Past Papers', icon: FileText },
        { id: 'videos', label: 'Lesson Modules', icon: Video },
        { id: 'results', label: 'Wall of Fame', icon: Award },
        { id: 'store', label: 'Study Materials', icon: ShoppingBag },
        { id: 'lms', label: currentUser ? 'LMS Dashboard' : 'LMS Portal', icon: Sparkles }
      ];

  const handleLinkClick = (id: ActiveTab) => {
    setMobileMenuOpen(false);
    onNavigate(id);
  };

  return (
    <header className="sticky top-3 sm:top-4 z-50 w-full px-3 sm:px-6 lg:px-8 max-w-[1600px] 2xl:max-w-[1720px] mx-auto transition-all duration-300">
      {/* Floating Glass Pill Header with elevated transparency & backdrop blur matching image.png */}
      <div className="w-full bg-white/70 backdrop-blur-2xl border border-white/80 shadow-[0_12px_40px_-15px_rgba(15,23,42,0.07)] rounded-full px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 sm:gap-4 transition-all duration-300 hover:bg-white/80 hover:border-white/90">
        
        {/* Left: Inspire Dark Crest Logo everywhere */}
        <div 
          onClick={() => {
            onNavigate('home');
            setMobileMenuOpen(false);
          }}
          className="cursor-pointer group shrink-0"
        >
          <InspireLogo size="md" />
        </div>

        {/* Center: Navigation Links (Clean text links; oval pill only on the selected tab) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {mainNavLinks.map((link) => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className={`transition-all duration-150 whitespace-nowrap ${
                  isActive 
                    ? 'px-4 py-1.5 rounded-full bg-slate-950 text-white shadow-xs font-semibold text-xs sm:text-sm' 
                    : 'px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-950 transition-colors'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Search Trigger */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-white/40 hover:bg-white/80 text-slate-700 text-xs font-medium border border-white/60 shadow-2xs backdrop-blur-md transition-all active:scale-95"
            title="Search (⌘K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px] text-slate-500 font-sans">⌘K</span>
          </button>

          {/* Cart Icon */}
          <button
            onClick={onOpenCart}
            className="relative p-2 rounded-full hover:bg-white/60 text-slate-600 hover:text-slate-900 transition-all active:scale-95"
            title="Study Materials Cart"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Account / Login & Register buttons */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full bg-white/50 hover:bg-white/80 border border-white/60 text-xs font-semibold text-slate-800 transition-all shadow-2xs backdrop-blur-md active:scale-95"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-bold">
                  {currentUser.name.charAt(0)}
                </div>
                <span className="hidden sm:inline max-w-[80px] truncate">{currentUser.name}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white/80 backdrop-blur-2xl border border-white/70 shadow-2xl p-2 z-50 text-left space-y-1">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-500 font-sans">{currentUser.indexNumber}</p>
                    <p className="text-[10px] text-emerald-600 font-medium">{currentUser.batch}</p>
                  </div>
                  {currentUser.role === 'Admin' ? (
                    <button
                      onClick={() => {
                        onNavigate('admin');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold text-slate-900 bg-blue-50/80 hover:bg-blue-100 flex items-center gap-2"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
                      <span>Admin Console</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onNavigate('lms');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-blue-600" />
                      <span>LMS Student Hub</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onLogout();
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={onOpenLogin}
                className="hidden sm:inline-flex px-4 sm:px-5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-[0_2px_10px_rgba(37,99,235,0.35)] hover:shadow-[0_4px_16px_rgba(37,99,235,0.45)] active:scale-95 tracking-wide"
              >
                LOGIN
              </button>
              <button
                onClick={onOpenSignUp}
                className="flex items-center gap-1 px-3.5 sm:px-4 py-1.5 rounded-full bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
              >
                <span>Register</span>
              </button>
            </div>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 sm:p-2 rounded-full hover:bg-white/60 text-slate-700 transition-colors"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>

      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-2 w-full rounded-3xl bg-white/95 backdrop-blur-2xl border border-white/80 shadow-[0_20px_50px_rgba(15,23,42,0.15)] p-4 sm:p-5 space-y-3 animate-in fade-in zoom-in-95 duration-200 text-left">
          <div className="grid grid-cols-2 gap-2">
            {mainNavLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link.id)}
                  className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2.5 transition-all text-left ${
                    isActive
                      ? 'bg-slate-950 text-white shadow-xs font-bold'
                      : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {Icon && <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />}
                  <span className="truncate">{link.label}</span>
                </button>
              );
            })}
          </div>

          {!currentUser && (
            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLogin();
                }}
                className="flex-1 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSignUp();
                }}
                className="flex-1 py-2.5 rounded-full bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-xs"
              >
                Register
              </button>
            </div>
          )}
        </div>
      )}

    </header>
  );
};
