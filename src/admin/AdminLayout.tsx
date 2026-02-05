
import React from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, FileText, Settings, LogOut, Package, Layers, Users, Inbox, Briefcase, Newspaper, Shield } from 'lucide-react';
import { auth } from '../lib/auth';

const AdminLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const user = auth.getUser();

    const handleSignOut = () => {
        auth.logout();
        navigate('/admin/login');
    };

    const navItems = [
        { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        { label: 'Inbox', path: '/admin/inbox', icon: Inbox },
        { label: 'Products', path: '/admin/products', icon: Package },
        { label: 'Categories', path: '/admin/categories', icon: Layers },
        { label: 'Landing', path: '/admin/landing', icon: Layers },
        { label: 'Orders', path: '/admin/orders', icon: ShoppingBag },
        { label: 'Customers', path: '/admin/customers', icon: Users },
        { label: 'Sales Team', path: '/admin/sales', icon: Briefcase },
        { label: 'All Users', path: '/admin/users', icon: Shield },
        { label: 'Blog', path: '/admin/blog', icon: Newspaper },
        { label: 'Content Editor', path: '/admin/content', icon: FileText },
        { label: 'Settings', path: '/admin/settings', icon: Settings },
    ];

    const role = (user as any)?.role || 'BUYER';
    const filteredNav = navItems.filter(item => {
        if (role === 'SUPER_ADMIN') return true;
        if (role === 'COMPANY_ADMIN') return true;
        if (role === 'SALESPERSON') {
            return ['/admin', '/admin/inbox', '/admin/orders', '/admin/customers', '/admin/sales'].includes(item.path);
        }
        if (role === 'BLOG_MANAGER') {
            return ['/admin/blog', '/admin/content'].includes(item.path);
        }
        return false;
    });

    const activeNavItem = [...navItems]
        .sort((a, b) => b.path.length - a.path.length)
        .find(item => location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/admin'));

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-navy-900 text-white flex flex-col flex-shrink-0 transition-all">
                <div className="p-6 border-b border-navy-800">
                    <h1 className="text-xl font-bold tracking-tight">Teraformix Admin</h1>
                    <p className="text-xs text-gray-400 mt-1">Backend Portal</p>
                </div>

                <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
                    {filteredNav.map((item) => {
                        const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/admin');
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-md transition duration-200 text-sm font-medium ${isActive
                                    ? 'bg-action-600 text-white shadow-md'
                                    : 'text-gray-300 hover:bg-navy-800 hover:text-white'
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
                        className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white transition w-full text-left text-sm rounded hover:bg-navy-800"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-grow flex flex-col h-screen overflow-hidden">
                <header className="bg-white shadow-sm border-b border-gray-200 py-4 px-8 flex justify-between items-center z-10">
                    <h2 className="text-lg font-semibold text-navy-900">
                        {activeNavItem?.label || 'Admin Area'}
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-right hidden md:block">
                            <p className="font-medium text-navy-900">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-navy-700 font-bold border border-gray-300">
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

export default AdminLayout;
