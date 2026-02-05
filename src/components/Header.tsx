
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Upload, ShoppingCart, User, Loader2, LogOut, LayoutDashboard, Package } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useGlobalContent } from '../contexts/GlobalContent';
import { api } from '../lib/api';
import { auth } from '../lib/auth';
import TopBar from './TopBar';
import ChristmasLights from './ChristmasLights';
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
  const activeTheme = content.settings.activeTheme;
  const isChristmas = activeTheme === 'christmas';
  // New Year badge handled via TopBar or standard logic, Header lights kept for Christmas only

  // Listen for auth changes
  useEffect(() => {
    const handleAuthChange = () => {
      setUser(auth.getUser());
      setIsAuthDropdownOpen(false);
    };
    window.addEventListener('auth-change', handleAuthChange);
    // Initial check
    setUser(auth.getUser());
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, [location]);

  // Debounced API Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim().length >= 2) {
        setIsSearching(true);
        // Search Categories Locally
        const term = searchTerm.trim().toLowerCase();
        const matches = content.categories.filter(c =>
          c.isActive && (c.name.toLowerCase().includes(term) || c.description.toLowerCase().includes(term))
        );
        setCategoryResults(matches);

        try {
          const results = await api.get<Product[]>(`/products/search?q=${encodeURIComponent(searchTerm.trim())}`);
          setSearchResults(results || []);
        } catch (error) {
          console.error("Search API failed:", error);
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
      const term = searchTerm.trim().toLowerCase();

      const category = content.categories.find(c =>
        c.name.toLowerCase() === term ||
        c.id.toLowerCase() === term
      );

      if (category) {
        navigate(`/category/${category.id}`);
      } else {
        navigate(`/category?search=${encodeURIComponent(searchTerm.trim())}`);
      }
    }
  };

  const handleResultClick = () => {
    setSearchTerm('');
    setIsFocused(false);
  };

  const handleLogout = () => {
    auth.logout();
    navigate('/');
  };

  return (
    <>
      <TopBar />
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm relative">
        {isChristmas && <ChristmasLights />}
        <div className="container mx-auto px-4 h-20 flex items-center justify-between relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-4 h-full py-2 relative">
            {/* Santa Hat SVG */}
            {isChristmas && (
              <svg className="absolute top-[-5px] left-[-15px] w-12 h-12 rotate-[-15deg] z-20 pointer-events-none drop-shadow-md" viewBox="0 0 512 512">
                <path fill="#D32F2F" d="M410.7 114.6c-4.4-1.2-8.5 1.2-9.8 5.6-8.9 30.6-32.9 83.1-98.9 104.9-38.6 12.8-78.2 8.3-108.7 1.8-19.1-4.1-39.2-2.3-56.9 7-23.7 12.4-38.7 26.6-47.5 39.4-12.8 18.6-13.4 39.9-10.9 57.6 2.3 16.3 10.7 32.7 21 44.2 13.9 15.6 33.1 26.3 54 30.1 8 1.5 16.1 2.3 24.3 2.3 32.5 0 71.9-10.9 107.5-35.8 45.9-32.1 79.5-84.4 97.4-151.7 4.1-15.5 16.1-59.5 28.3-105.4 0.1-0.2 0.2-0.5 0.2-0.7 1.2-4.2-1.3-8.6-5.7-9.9z" />
                <path fill="#F5F5F5" d="M129.5 394.5c8.3 0 16.5-0.8 24.5-2.3 21.6-3.9 41.5-15 55.9-31.1 10.7-11.9 19-28.9 21.4-45.7 2.6-18.4 2-41-11.4-60.4-9.1-13.3-24.6-28-49.1-40.8-3.6-1.9-7.7-2.9-11.9-2.9-10.7 0-20.9 6.2-25.5 16.1-5 10.7-3.2 23.4 4.5 32.1 4.3 4.8 9.2 8.9 14.5 12.3 14 9 31.7 11 47.9 5.3 4.2-1.5 8.8 0.7 10.3 4.9 1.5 4.2-0.7 8.8-4.9 10.3-22.6 8-48.4 4.8-67.7-7.7-8-5.2-15.2-11.5-21.3-18.8-11.6 24-9.8 54.4 7.6 79.6 15.7 22.8 40.7 34.6 68.1 35.6-21.2 5.3-43.2 8.6-64.8 11.2 5.1 1.7 10.6 2.6 16.1 2.6" />
                <circle fill="#F5F5F5" cx="423.8" cy="103.5" r="32.5" />
              </svg>
            )}
            <Link to="/" className="tracking-tight focus:outline-none focus:ring-2 focus:ring-navy-500 rounded-sm flex items-center h-full">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={logoText}
                  width="170"
                  height="64"
                  className="max-h-12 md:max-h-16 w-auto object-contain"
                />
              ) : (
                <span className="text-navy-900 text-xl md:text-2xl font-bold">{logoText}</span>
              )}
            </Link>
          </div>

          {/* Super Search */}
          <div className="hidden md:block flex-1 max-w-2xl mx-8 relative z-50">
            <form onSubmit={handleSearch} className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <label htmlFor="global-search" className="sr-only">Search catalog</label>
              <input
                id="global-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                autoComplete="off"
                className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-navy-800 focus:border-navy-800 sm:text-sm transition duration-150 ease-in-out"
                placeholder="Search by Part #, SKU, Model, or Keyword..."
                aria-label="Search products"
              />
              {isSearching && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Loader2 className="h-4 w-4 text-navy-600 animate-spin" />
                </div>
              )}
            </form>

            {/* Instant Search Results Dropdown */}
            {isFocused && searchTerm.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden max-h-[80vh] overflow-y-auto">
                {/* Categories Section */}
                {categoryResults.length > 0 && (
                  <div className="border-b border-gray-100">
                    <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">
                      Categories
                    </div>
                    <ul>
                      {categoryResults.slice(0, 3).map((category) => (
                        <li key={category.id}>
                          <Link
                            to={`/category/${category.id}`}
                            onClick={handleResultClick}
                            className="flex items-center gap-3 p-3 hover:bg-gray-50 transition"
                          >
                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded flex items-center justify-center flex-shrink-0">
                              <LayoutDashboard className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-semibold text-navy-900 text-sm">{category.name}</div>
                              <div className="text-xs text-gray-500 line-clamp-1">{category.description}</div>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Products Section */}
                {(searchResults.length > 0 || categoryResults.length > 0) ? (
                  <>
                    {searchResults.length > 0 && (
                      <div>
                        {categoryResults.length > 0 && (
                          <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                            Products
                          </div>
                        )}
                        <ul>
                          {searchResults.slice(0, 6).map((product) => (
                            <li key={product.id}>
                              <Link
                                to={`/product/${product.sku}`}
                                onClick={handleResultClick}
                                className="flex items-center gap-4 p-3 hover:bg-gray-50 transition border-b border-gray-100 last:border-0"
                              >
                                <div className="h-10 w-10 flex-shrink-0 bg-white border border-gray-200 rounded flex items-center justify-center p-0.5">
                                  <Image src={product.image} alt="" className="h-full w-full object-contain" />
                                </div>
                                <div className="flex-grow min-w-0">
                                  <div className="font-semibold text-navy-900 text-sm truncate">{product.name}</div>
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="font-mono text-gray-500">{product.sku}</span>
                                    <span className="text-gray-300">|</span>
                                    <span className="font-bold text-action-600">${product.price.toLocaleString()}</span>
                                  </div>
                                </div>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="p-2 bg-gray-50 text-center border-t border-gray-200 sticky bottom-0">
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => handleSearch(e)}
                        className="text-xs font-bold text-navy-700 hover:text-action-600 w-full py-1"
                      >
                        View all results for "{searchTerm}"
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center text-gray-500 text-sm">
                    {isSearching ? (
                      <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Searching...</span>
                    ) : (
                      <p>No results found for "{searchTerm}"</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Link
                to="/upload-bom"
                className="hidden lg:flex items-center gap-2 text-sm font-medium text-navy-700 hover:text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-500 rounded-sm px-2 py-1"
              >
                <Upload className="w-4 h-4" />
                Upload BOM
              </Link>

              {/* Tooltip */}
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-80 bg-navy-900 text-white rounded-lg shadow-2xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                {/* Arrow */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-navy-900 rotate-45"></div>

                {/* Content */}
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-action-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Upload className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="font-bold text-sm">What is a BOM?</h4>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed mb-2">
                    A <strong className="text-white">Bill of Materials (BOM)</strong> is a list of parts you need for your project. Upload your spreadsheet with part numbers and quantities, and we'll provide a complete quote.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-action-400">
                    <span className="inline-block w-1.5 h-1.5 bg-action-400 rounded-full"></span>
                    <span>Supports .XLS, .XLSX, .CSV, .PDF</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-6 w-px bg-gray-300 hidden lg:block" aria-hidden="true"></div>

            <Link
              to="/cart"
              className="flex items-center gap-2 text-navy-900 hover:text-action-600 focus:outline-none focus:ring-2 focus:ring-navy-500 rounded-sm px-2 py-1"
              aria-label={`View Shopping Cart, ${cartCount} items`}
            >
              <div className="relative">
                <ShoppingCart className="w-6 h-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-action-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-bounce">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="hidden lg:inline text-sm font-semibold">Cart</span>
            </Link>

            <div className="relative">
              <button
                onClick={() => setIsAuthDropdownOpen(!isAuthDropdownOpen)}
                className="flex items-center gap-2 text-navy-700 hover:text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-500 rounded-full p-1"
                aria-label="User Account"
              >
                {user.email ? (
                  <div className="w-8 h-8 bg-navy-900 text-white rounded-full flex items-center justify-center font-bold text-xs">
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                ) : (
                  <User className="w-6 h-6" />
                )}
              </button>

              {/* Auth Dropdown */}
              {isAuthDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 animate-fadeIn">
                  {user.email ? (
                    <>
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-bold text-navy-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <Link
                        to={user.role === 'SUPER_ADMIN' ? '/admin' : user.role === 'SALESPERSON' ? '/salesteam' : '/account'}
                        onClick={() => setIsAuthDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-navy-900"
                      >
                        <div className="flex items-center gap-2">
                          <LayoutDashboard className="w-4 h-4" />
                          {user.role === 'BUYER' ? 'My Account' : 'Dashboard'}
                        </div>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        onClick={() => setIsAuthDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-navy-900"
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setIsAuthDropdownOpen(false)}
                        className="block px-4 py-2 text-sm font-bold text-action-600 hover:bg-gray-50"
                      >
                        Create Account
                      </Link>
                    </>
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
