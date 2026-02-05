
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Loader2, Server, Users } from 'lucide-react';
import { auth } from '../../lib/auth';

const SalesLogin = () => {
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
      if (result.success && result.role === 'SALESPERSON') {
        navigate('/salesteam');
      } else if (result.success) {
        setError('Access denied. Invalid sales account privileges.');
      } else {
        setError(result.message || 'Access denied. Not a valid sales account.');
      }
    } catch (err) {
      setError('System unavailable. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-navy-100 border border-navy-200 mb-4 shadow-sm">
                <Users className="w-7 h-7 text-navy-600" />
            </div>
            <h1 className="text-2xl font-bold text-navy-900">Sales Team Portal</h1>
            <p className="text-gray-500 mt-1">Access your dashboard and manage orders.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded text-red-600 text-sm">
                 {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Sales Email</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-900 outline-none"
                  placeholder="you@servertechcentral.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-900 outline-none"
                />
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-navy-900 hover:bg-navy-800 text-white font-bold py-3 rounded-lg shadow transition flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
        </div>
        <div className="text-center mt-6">
            <Link to="/" className="text-sm text-gray-500 hover:text-navy-900 transition">&larr; Back to Main Site</Link>
        </div>
      </div>
    </div>
  );
};

export default SalesLogin;
