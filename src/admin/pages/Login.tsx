
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, ArrowRight, Loader2, Server } from 'lucide-react';
import { auth } from '../../lib/auth';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await auth.login(email, password);
      if (result.success && result.role === 'SUPER_ADMIN') {
        navigate('/admin');
      } else if (result.success) {
        setError('Access denied. Admin privileges required.');
      } else {
        setError(result.message || 'Authentication failed');
      }
    } catch (err) {
      setError('System unavailable. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 opacity-20">
         <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
         <div className="absolute bottom-0 right-0 w-96 h-96 bg-action-600 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-navy-800 border border-navy-700 mb-4 shadow-lg">
            <Server className="w-8 h-8 text-action-500" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Server Tech Central</h1>
          <p className="text-gray-400 text-sm mt-2">Authorized Personnel Access Only</p>
        </div>

        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          <div className="p-8">
            <h2 className="text-xl font-bold text-navy-900 mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5 text-gray-400" />
              Secure Login
            </h2>

            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded text-red-600 text-sm flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                 {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-navy-900 focus:ring-2 focus:ring-navy-900 focus:border-navy-900 outline-none transition"
                  placeholder="admin@servertechcentral.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-navy-900 focus:ring-2 focus:ring-navy-900 focus:border-navy-900 outline-none transition"
                  placeholder="••••••••••••"
                />
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-navy-900 hover:bg-navy-800 text-white font-bold py-3 rounded-lg shadow transition transform active:scale-[0.99] flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Access Dashboard'}
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          </div>
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-action-600" />
              <span>256-bit Encrypted Session</span>
            </div>
            <span>v2.4.0</span>
          </div>
        </div>
        
        <div className="text-center mt-8 text-xs text-gray-500">
          &copy; {new Date().getFullYear()} Server Tech Central. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default Login;
