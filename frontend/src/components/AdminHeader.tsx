import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService.js';
import { LogOut, UserCircle } from 'lucide-react';

export const AdminHeader: React.FC = () => {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/admin/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-xs">
      <div>
        <h1 className="text-sm font-semibold text-slate-800">Marketplace Operations Management</h1>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-slate-400" />
            <div className="text-right">
              <span className="block text-xs font-semibold text-slate-800 leading-tight">
                {user.full_name}
              </span>
              <span className="inline-block text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 font-bold rounded">
                {user.role}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-red-600 px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
          title="Sign out of operations portal"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
