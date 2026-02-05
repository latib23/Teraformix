import React from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, LogOut, User, FileText } from 'lucide-react';
import { auth } from '../lib/auth';

const SalesLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = auth.getUser();

  const handleSignOut = () => {
    auth.logout();
    navigate('/salesteam/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/salesteam', icon: LayoutDashboard },
    { label: 'Quotes & Requests', path: '/salesteam/quotes', icon: FileText },
    { label: 'My Orders', path: '/salesteam/orders', icon: ShoppingBag },
  ];

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <aside className="w-64 bg-navy-900 text-white flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-navy-800">
          <h1 className="text-xl font-bold tracking-tight">Sales Portal</h1>
          <p className="text-xs text-gray-400 mt-1">Teraformix</p>
        </div>
        
        <nav className="flex-grow p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-md transition text-sm font-medium ${
                  isActive 
                  ? 'bg-action-600 text-white' 
                  : 'text-gray-300 hover:bg-navy-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-navy-800">
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white transition w-full text-left text-sm"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-grow flex flex-col h-screen overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 py-4 px-8 flex justify-between items-center z-10">
          <h2 className="text-lg font-semibold text-navy-900">
            {navItems.find(i => i.path === location.pathname)?.label || 'Sales Dashboard'}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-right">
              <p className="font-medium text-navy-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold border border-blue-200">
              {user.name.charAt(0)}
            </div>
          </div>
        </header>
        <div className="flex-grow overflow-auto p-8">
           <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SalesLayout;