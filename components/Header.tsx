
import React, { useState, useEffect, useRef } from 'react';
import { auth, signOut } from '../firebase';
import { LogOut, User as UserIcon, FileText, Video, UserCircle } from 'lucide-react';

interface Props {
  onReset: () => void;
  onShowResumes?: () => void;
  onShowInterviews?: () => void;
  onShowProfile?: () => void;
}

const Header: React.FC<Props> = ({ onReset, onShowResumes, onShowInterviews, onShowProfile }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const user = auth.currentUser;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 backdrop-blur-md bg-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center gap-3 cursor-pointer" onClick={onReset}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tighter">CareerEdge<span className="text-indigo-600">AI</span></span>
          </div>
          
          <div className="flex items-center">
            {user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 p-1 rounded-2xl border-2 border-transparent hover:border-slate-100 hover:bg-slate-50 transition-all"
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-xl shadow-sm" />
                  ) : (
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-3 w-72 bg-white rounded-3xl shadow-2xl border border-slate-100 py-4 z-20 animate-slide-up">
                    <div className="px-6 py-4 border-b border-slate-50">
                      <p className="text-sm font-black text-slate-900 truncate">{user.displayName}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter truncate">{user.email}</p>
                    </div>
                    
                    <div className="p-2">
                      <button
                        onClick={() => { onShowProfile?.(); setShowDropdown(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-2xl font-bold transition-all"
                      >
                        <UserCircle className="w-5 h-5" />
                        My Profile
                      </button>

                      <div className="h-[1px] bg-slate-50 my-2 mx-4" />
                      
                      <button
                        onClick={() => { onShowResumes?.(); setShowDropdown(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-2xl font-bold transition-all"
                      >
                        <FileText className="w-5 h-5" />
                        My Resumes
                      </button>

                      <button
                        onClick={() => { onShowInterviews?.(); setShowDropdown(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-2xl font-bold transition-all"
                      >
                        <Video className="w-5 h-5" />
                        Interview History
                      </button>

                      <div className="h-[1px] bg-slate-50 my-2 mx-4" />

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-50 rounded-2xl font-bold transition-all"
                      >
                        <LogOut className="w-5 h-5" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
