
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { auth } from '../../lib/auth';
import { Lock, Mail, User, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';

const CustomerRegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
        return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      const result = await auth.register(formData.name, formData.email, formData.password);
      if (result.success) {
        // Auto login after register
        await auth.login(formData.email, formData.password);
        window.dispatchEvent(new Event('auth-change'));
        navigate('/account');
      } else {
        setError(result.message || 'Registration failed.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
            
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-navy-900">Create Account</h1>
                <p className="text-gray-500 mt-2">Join thousands of enterprise procurement teams.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-8">
                    {error && (
                    <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded text-red-600 text-sm">
                        {error}
                    </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                        <div className="relative">
                        <User className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        <input 
                            type="text" 
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-900 outline-none"
                            placeholder="John Doe"
                        />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Business Email</label>
                        <div className="relative">
                        <Mail className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        <input 
                            type="email" 
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-900 outline-none"
                            placeholder="name@company.com"
                        />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                        <div className="relative">
                        <Lock className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        <input 
                            type="password" 
                            required
                            minLength={8}
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-900 outline-none"
                            placeholder="8+ Characters"
                        />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password</label>
                        <div className="relative">
                        <Lock className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        <input 
                            type="password" 
                            required
                            minLength={8}
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-900 outline-none"
                            placeholder="Repeat Password"
                        />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-action-600 hover:bg-action-500 text-white font-bold py-3 rounded-lg shadow transition flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register Account'}
                        {!isLoading && <ArrowRight className="w-4 h-4" />}
                    </button>
                    </form>
                </div>
                <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex flex-col gap-2 text-center text-sm">
                    <div>
                        <span className="text-gray-600">Already registered? </span>
                        <Link to="/login" className="text-navy-900 font-bold hover:underline">Sign In</Link>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-2">
                        <ShieldCheck className="w-4 h-4 text-green-600" />
                        <span>Secure & Encrypted Data</span>
                    </div>
                </div>
            </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CustomerRegisterPage;
