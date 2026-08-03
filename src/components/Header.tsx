import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  FileUp,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Search,
  ServerCog,
  ShoppingCart,
  User,
  X,
} from 'lucide-react';
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
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [categoryResults, setCategoryResults] = useState<Category[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [user, setUser] = useState(auth.getUser());
  const [isAuthDropdownOpen, setIsAuthDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { cartCount } = useCart();
  const { content } = useGlobalContent();
  const { logoUrl, logoText } = content.settings;
  const activeCategories = content.categories.filter((category) => category.isActive).slice(0, 5);

  useEffect(() => {
    const handleAuthChange = () => {
      setUser(auth.getUser());
      setIsAuthDropdownOpen(false);
    };
    window.addEventListener('auth-change', handleAuthChange);
    setUser(auth.getUser());
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, [location]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsAuthDropdownOpen(false);
    setIsFocused(false);
  }, [location.pathname]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim().length < 2) {
        setSearchResults([]);
        setCategoryResults([]);
        return;
      }

      setIsSearching(true);
      const term = searchTerm.trim().toLowerCase();
      setCategoryResults(
        content.categories.filter((category) =>
          category.isActive
          && (category.name.toLowerCase().includes(term) || category.description.toLowerCase().includes(term)),
        ),
      );

      try {
        const results = await api.get<Product[]>(`/products/search?q=${encodeURIComponent(searchTerm.trim())}`);
        setSearchResults(results || []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [content.categories, searchTerm]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (!searchTerm.trim()) return;

    setIsFocused(false);
    const category = content.categories.find(
      (item) => item.name.toLowerCase() === searchTerm.trim().toLowerCase(),
    );
    navigate(category
      ? `/category/${category.id}`
      : `/category?search=${encodeURIComponent(searchTerm.trim())}`);
  };

  const handleLogout = () => {
    auth.logout();
    navigate('/');
  };

  const SearchBox = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`relative ${mobile ? 'w-full' : 'w-full max-w-2xl'}`}>
      <form onSubmit={handleSearch} className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          autoComplete="off"
          aria-label="Search product catalog"
          className="h-11 w-full border border-slate-300 bg-slate-50 pl-10 pr-10 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-600/10"
          placeholder="Search manufacturer part number or product"
        />
        {isSearching ? (
          <Loader2 className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-emerald-600" />
        ) : null}
      </form>

      {isFocused && searchTerm.length >= 2 ? (
        <div className="absolute left-0 right-0 top-full z-[70] mt-2 max-h-[70vh] overflow-y-auto border border-slate-200 bg-white shadow-xl">
          {categoryResults.length > 0 ? (
            <div className="border-b border-slate-200">
              <div className="bg-slate-50 px-4 py-2 text-[11px] font-bold uppercase text-slate-500">
                Categories
              </div>
              {categoryResults.slice(0, 3).map((category) => (
                <Link
                  key={category.id}
                  to={`/category/${category.id}`}
                  className="flex items-center gap-3 border-t border-slate-100 px-4 py-3 hover:bg-slate-50"
                >
                  <LayoutDashboard className="h-4 w-4 text-emerald-700" />
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">{category.name}</span>
                    <span className="block text-xs text-slate-500">{category.description}</span>
                  </span>
                </Link>
              ))}
            </div>
          ) : null}

          {searchResults.length > 0 ? (
            <div>
              <div className="bg-slate-50 px-4 py-2 text-[11px] font-bold uppercase text-slate-500">
                Products
              </div>
              {searchResults.slice(0, 5).map((product) => (
                <Link
                  key={product.id}
                  to={`/product/${product.sku}`}
                  className="grid grid-cols-[44px_1fr_auto] items-center gap-3 border-t border-slate-100 px-4 py-3 hover:bg-slate-50"
                >
                  <div className="flex h-11 w-11 items-center justify-center border border-slate-200 bg-white p-1">
                    <Image src={product.image} alt="" className="h-full w-full object-contain mix-blend-multiply" />
                  </div>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-900">{product.name}</span>
                    <span className="block font-mono text-xs text-slate-500">{product.sku}</span>
                  </span>
                  <span className="text-sm font-bold text-slate-900">${product.price.toLocaleString()}</span>
                </Link>
              ))}
            </div>
          ) : null}

          {!isSearching && categoryResults.length === 0 && searchResults.length === 0 ? (
            <div className="px-4 py-5 text-sm text-slate-500">No matching catalog items found.</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  return (
    <>
      <TopBar />
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center gap-5 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex shrink-0 items-center" aria-label="Teraformix home">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={logoText}
                className="h-10 w-[170px] object-contain"
              />
            ) : (
              <span className="text-xl font-black text-slate-950">{logoText}</span>
            )}
          </Link>

          <div className="hidden flex-1 justify-center md:flex">
            <SearchBox />
          </div>

          <div className="ml-auto flex h-full items-center">
            <Link
              to="/configurator"
              className="hidden h-10 items-center gap-2 border-r border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:text-emerald-700 lg:flex"
            >
              <ServerCog className="h-4 w-4" />
              Server Builder
            </Link>

            <Link
              to="/cart"
              className="relative flex h-10 items-center gap-2 border-r border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:text-emerald-700"
              aria-label={`Cart with ${cartCount} items`}
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="hidden xl:inline">Cart</span>
              {cartCount > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center bg-emerald-700 px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              ) : null}
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAuthDropdownOpen((open) => !open)}
                aria-label="Open account menu"
                aria-expanded={isAuthDropdownOpen}
                className="flex h-10 items-center gap-2 px-4 text-slate-700 transition hover:text-emerald-700"
              >
                {user.email ? (
                  <span className="flex h-8 w-8 items-center justify-center bg-slate-900 text-sm font-bold text-white">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <User className="h-5 w-5" />
                )}
                <ChevronDown className="hidden h-3.5 w-3.5 sm:block" />
              </button>

              {isAuthDropdownOpen ? (
                <div className="absolute right-0 top-full mt-2 w-56 border border-slate-200 bg-white py-1 shadow-xl">
                  {user.email ? (
                    <>
                      <div className="border-b border-slate-200 px-4 py-3">
                        <p className="truncate text-sm font-bold text-slate-900">{user.name}</p>
                        <p className="truncate text-xs text-slate-500">{user.email}</p>
                      </div>
                      <Link to="/account" className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                        Account dashboard
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-700 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </>
                  ) : (
                    <div className="space-y-2 p-3">
                      <Link to="/login" className="block border border-slate-300 px-3 py-2 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50">
                        Log in
                      </Link>
                      <Link to="/register" className="block bg-slate-900 px-3 py-2 text-center text-sm font-bold text-white hover:bg-slate-800">
                        Create account
                      </Link>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              aria-label={isMobileMenuOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={isMobileMenuOpen}
              className="flex h-10 w-10 items-center justify-center border-l border-slate-200 text-slate-800 md:hidden"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <nav aria-label="Primary navigation" className="hidden border-t border-slate-200 bg-white md:block">
          <div className="mx-auto flex h-11 max-w-[1440px] items-center gap-7 px-4 text-sm sm:px-6 lg:px-8">
            <Link to="/category" className="font-bold text-slate-900 hover:text-emerald-700">Products</Link>
            {activeCategories.map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.id}`}
                className="text-slate-600 hover:text-emerald-700"
              >
                {category.name}
              </Link>
            ))}
            <span className="h-5 w-px bg-slate-200" />
            <Link to="/upload-bom" className="flex items-center gap-1.5 text-slate-600 hover:text-emerald-700">
              <FileUp className="h-4 w-4" />
              Upload BOM
            </Link>
            <Link to="/track" className="ml-auto text-slate-600 hover:text-emerald-700">Track order</Link>
            <Link to="/contact" className="font-semibold text-slate-900 hover:text-emerald-700">Contact sales</Link>
          </div>
        </nav>

        {isMobileMenuOpen ? (
          <div className="border-t border-slate-200 bg-white p-4 md:hidden">
            <SearchBox mobile />
            <nav aria-label="Mobile navigation" className="mt-4 grid grid-cols-2 border-t border-slate-200 pt-3">
              <Link to="/category" className="border-b border-slate-100 py-3 text-sm font-bold text-slate-900">Products</Link>
              <Link to="/configurator" className="border-b border-slate-100 py-3 text-sm font-bold text-emerald-700">Server Builder</Link>
              {activeCategories.slice(0, 4).map((category) => (
                <Link key={category.id} to={`/category/${category.id}`} className="border-b border-slate-100 py-3 text-sm text-slate-600">
                  {category.name}
                </Link>
              ))}
              <Link to="/upload-bom" className="border-b border-slate-100 py-3 text-sm text-slate-600">Upload BOM</Link>
              <Link to="/contact" className="border-b border-slate-100 py-3 text-sm text-slate-600">Contact sales</Link>
            </nav>
          </div>
        ) : null}
      </header>
    </>
  );
};

export default Header;
