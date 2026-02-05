
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Loader2, LogOut, LayoutDashboard, Package, Menu } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useGlobalContent } from '../contexts/GlobalContent';
import { api } from '../lib/api';
import { auth } from '../lib/auth';
import TopBar from './TopBar';
import Image from './Image';
import { Product, Category } from '../types';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Server-side search states
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [categoryResults, setCategoryResults] = useState<Category[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Auth State
  const [user, setUser] = useState(auth.getUser());
  const [isAuthDropdownOpen, setIsAuthDropdownOpen] = useState(false);

  const { cartCount } = useCart();
  const { content } = useGlobalContent();
  const { logoUrl, logoText } = content.settings;

  // Listen for auth changes
  useEffect(() => {
    const handleAuthChange = () => {
      setUser(auth.getUser());
      setIsAuthDropdownOpen(false);
    };
    window.addEventListener('auth-change', handleAuthChange);
    setUser(auth.getUser());
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, [location]);

  // Debounced API Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim().length >= 2) {
        setIsSearching(true);
        const term = searchTerm.trim().toLowerCase();
        const matches = content.categories.filter(c =>
          c.isActive && (c.name.toLowerCase().includes(term) || c.description.toLowerCase().includes(term))
        );
        setCategoryResults(matches);

        try {
          const results = await api.get<Product[]>(`/products/search?q=${encodeURIComponent(searchTerm.trim())}`);
          setSearchResults(results || []);
        } catch (error) {
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setCategoryResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setIsFocused(false);
      const category = content.categories.find(c => c.name.toLowerCase() === searchTerm.trim().toLowerCase());
      if (category) {
        navigate(`/category/${category.id}`);
      } else {
        navigate(`/category?search=${encodeURIComponent(searchTerm.trim())}`);
      }
    }
  };

  const handleLogout = () => {
    auth.logout();
    navigate('/');
  };

  return (
    <>
      <TopBar />
      <header className="sticky top-0 z-50 bg-navy-900 border-b border-navy-800 shadow-lg relative transition-all duration-300">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between relative z-10">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={logoText}
                className="h-10 w-auto object-contain brightness-0 invert group-hover:opacity-80 transition"
              />
            ) : (
              <span className="text-white text-2xl font-bold tracking-tight">{logoText}</span>
            )}
          </Link>

          {/* Integrated Dark Search Bar */}
          <div className="hidden md:block flex-1 max-w-2xl mx-8 relative z-50">
            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-action-500 transition-colors" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                autoComplete="off"
                className="block w-full pl-10 pr-10 py-2.5 border border-navy-700 rounded-full leading-5 bg-navy-800 text-white placeholder-gray-500 focus:outline-none focus:bg-navy-950 focus:ring-1 focus:ring-action-500 focus:border-action-500 sm:text-sm transition-all duration-200"
                placeholder="Search part numbers, models, or keywords..."
              />
              {isSearching && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Loader2 className="h-4 w-4 text-action-500 animate-spin" />
                </div>
              )}
            </form>

            {/* Dark Search Results Dropdown */}
            {isFocused && searchTerm.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-navy-900 rounded-lg shadow-2xl border border-navy-700 overflow-hidden max-h-[80vh] overflow-y-auto z-50 ring-1 ring-black ring-opacity-5">
                {/* Categories */}
                {categoryResults.length > 0 && (
                  <div className="border-b border-navy-800">
                    <div className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-navy-950/50">
                      Categories
                    </div>
                    <ul>
                      {categoryResults.slice(0, 3).map((category) => (
                        <li key={category.id}>
                          <Link
                            to={`/category/${category.id}`}
                            className="flex items-center gap-3 p-3 hover:bg-navy-800 transition"
                          >
                            <div className="w-8 h-8 bg-navy-800 text-action-500 rounded flex items-center justify-center border border-navy-700">
                              <LayoutDashboard className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-semibold text-white text-sm">{category.name}</div>
                              <div className="text-xs text-gray-400">{category.description}</div>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Products */}
                {searchResults.length > 0 && (
                  <div className="border-b border-navy-800">
                    <div className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-navy-950/50">
                      Products
                    </div>
                    <ul>
                      {searchResults.slice(0, 5).map((product) => (
                        <li key={product.id}>
                          <Link
                            to={`/product/${product.sku}`}
                            className="flex items-center gap-4 p-3 hover:bg-navy-800 transition border-b border-navy-800 last:border-0"
                          >
                            <div className="h-10 w-10 bg-white rounded p-0.5 flex-shrink-0">
                              <Image src={product.image} alt="" className="h-full w-full object-contain mix-blend-multiply" />
                            </div>
                            <div className="flex-grow min-w-0">
                              <div className="font-medium text-white text-sm truncate">{product.name}</div>
                              <div className="text-xs text-gray-400 font-mono">{product.sku}</div>
                            </div>
                            <div className="text-action-500 font-bold text-sm">
                              ${product.price.toLocaleString()}
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-6">
            <Link
              to="/cart"
              className="relative group text-gray-400 hover:text-white transition"
            >
              <ShoppingCart className="w-6 h-6" />
              <span className="absolute -top-2 -right-2 bg-action-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {cartCount}
              </span>
            </Link>

            <div className="relative">
              <button
                onClick={() => setIsAuthDropdownOpen(!isAuthDropdownOpen)}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition focus:outline-none"
              >
                {user.email ? (
                  <div className="w-8 h-8 bg-action-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg shadow-action-900/50">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <User className="w-6 h-6" />
                )}
              </button>

              {/* Auth Dropdown */}
              {isAuthDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-navy-900 rounded-lg shadow-xl border border-navy-700 py-1 z-50 animate-fadeIn">
                  {user.email ? (
                    <>
                      <div className="px-4 py-3 border-b border-navy-800">
                        <p className="text-sm font-bold text-white truncate">{user.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                      <Link to="/account" className="block px-4 py-2 text-sm text-gray-300 hover:bg-navy-800 hover:text-white transition">Dashboard</Link>
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-navy-800 transition flex items-center gap-2"><LogOut className="w-3 h-3" /> Sign Out</button>
                    </>
                  ) : (
                    <div className="p-2 space-y-2">
                      <Link to="/login" className="block text-center w-full py-2 rounded bg-navy-800 text-white hover:bg-navy-700 transition text-sm font-medium">Log In</Link>
                      <Link to="/register" className="block text-center w-full py-2 rounded bg-action-600 text-white hover:bg-action-500 transition text-sm font-bold">Register</Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
