import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Gallery from './components/Gallery';
import Contact from './components/Contact';
import Footer from './components/Footer';
import VoiceSupport from './components/VoiceSupport';
import AdminMessages from './components/AdminMessages';
import { MessageCircle, ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react';

const ADMIN_PASSWORD = 'PhotoIllusions2026';

const App: React.FC = () => {
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const session = sessionStorage.getItem('adminAuth');
    if (session === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#admin') {
        setShowAdmin(true);
      } else {
        setShowAdmin(false);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const openSupport = () => setIsSupportOpen(true);
  const closeSupport = () => setIsSupportOpen(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminAuth', 'true');
      setError('');
      setPassword('');
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('adminAuth');
    window.location.hash = '';
    setShowAdmin(false);
  };

  if (showAdmin && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 w-full max-w-md border border-white/20 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <ShieldCheck size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Admin Access</h1>
            <p className="text-gray-400">Enter password to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all transform hover:scale-[1.02] shadow-lg shadow-blue-600/30"
            >
              Access Admin Panel
            </button>
          </form>

          <button
            onClick={() => {
              window.location.hash = '';
              setShowAdmin(false);
            }}
            className="w-full mt-4 py-3 text-gray-400 hover:text-white transition-colors text-sm"
          >
            ← Back to Website
          </button>
        </div>
      </div>
    );
  }

  if (showAdmin && isAuthenticated) {
    return (
      <div className="relative">
        <AdminMessages onBack={() => {
          window.location.hash = '';
          setShowAdmin(false);
        }} />
        <button
          onClick={handleLogout}
          className="fixed top-4 right-4 z-50 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-all"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-500 selection:text-white">
      <Navbar />

      <main>
        <Hero onSupportClick={openSupport} />

        {/* Services Teaser */}
        <section id="services" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-serif text-gray-900 mb-12 font-bold">Capture The Magic</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                { title: 'On-Site Photo Booth', desc: 'Interactive photo experiences with instant digital sharing and fun props.' },
                { title: 'On-Site Digital Printing', desc: 'Professional 8x10 prints produced immediately at your event.' },
                { title: 'Daycare Center Photography', desc: 'Professional on-site portraits and instant printing services for schools and childcare centers.' }
              ].map((service, i) => (
                <div key={i} className="p-8 border border-gray-200 hover:border-blue-500 transition-all duration-300 group bg-gray-50 hover:bg-white hover:shadow-xl rounded-lg flex flex-col justify-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">{service.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{service.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Gallery />

        <Contact />
      </main>

      <Footer />

      <div className="fixed bottom-8 right-8 z-40 flex flex-col items-end gap-3">
        <button
          onClick={() => {
            window.location.hash = 'admin';
            setShowAdmin(true);
          }}
          className="p-3 bg-gray-200/50 hover:bg-blue-600 hover:text-white text-gray-400 rounded-full transition-all backdrop-blur-sm"
          title="Admin View"
        >
          <ShieldCheck size={18} />
        </button>

        <button
          onClick={openSupport}
          className="flex items-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full shadow-lg shadow-blue-600/30 transition-all transform hover:scale-105"
        >
          <MessageCircle size={20} /> Let's Chat!
        </button>
      </div>

      <VoiceSupport isOpen={isSupportOpen} onClose={closeSupport} />
    </div>
  );
};

export default App;
