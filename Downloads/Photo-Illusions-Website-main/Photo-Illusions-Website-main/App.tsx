import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Gallery from './components/Gallery';
import Contact from './components/Contact';
import Footer from './components/Footer';
import VoiceSupport from './components/VoiceSupport';
import AdminMessages from './components/AdminMessages';
import { MessageCircle, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  // Handle URL hash for easy admin access (e.g., #admin)
  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === '#admin') {
        setShowAdmin(true);
      } else {
        setShowAdmin(false);
      }
    };

    handleHash(); // Check on mount
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const openSupport = () => setIsSupportOpen(true);
  const closeSupport = () => setIsSupportOpen(false);

  if (showAdmin) {
    return <AdminMessages onBack={() => {
      window.location.hash = '';
      setShowAdmin(false);
    }} />;
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
                { title: 'Fashion Event Photography', desc: 'High-end fashion style photography stations for your guests.' }
              ].map((service, i) => (
                <div key={i} className="p-8 border border-gray-200 hover:border-blue-500 transition-all duration-300 group bg-gray-50 hover:bg-white hover:shadow-xl rounded-lg">
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

      {/* Floating Chat Widget */}
      <div className="fixed bottom-8 right-8 z-40 flex flex-col items-end gap-3">
        {/* Hidden-ish Admin Toggle */}
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