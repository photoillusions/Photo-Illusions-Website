import React from 'react';
import { Camera, Sparkles, Star } from 'lucide-react';

interface HeroProps {
  onSupportClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ onSupportClick }) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 animate-pulse">
        <Sparkles className="text-blue-400 w-8 h-8" />
      </div>
      <div className="absolute bottom-32 right-20 animate-pulse delay-300">
        <Star className="text-yellow-400 w-6 h-6" />
      </div>
      <div className="absolute top-40 right-32 animate-pulse delay-500">
        <Camera className="text-blue-300 w-10 h-10" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        <div className="mb-6">
          <span className="inline-block px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-full text-blue-300 text-sm font-medium">
            Mt. Holly, NJ • Available for Events
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 leading-tight">
          Capture Every
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            Magical Moment
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
          Professional on-site photography studio bringing Hollywood glamour to your events. 
          AI-enhanced portraits delivered instantly.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#contact"
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full text-lg shadow-lg shadow-blue-600/30 transition-all transform hover:scale-105"
          >
            Book Your Event
          </a>
          <button
            onClick={onSupportClick}
            className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full text-lg border border-white/20 transition-all"
          >
            Ask AI Assistant
          </button>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
          {[
            { value: '500+', label: 'Events' },
            { value: '10K+', label: 'Photos' },
            { value: '5★', label: 'Rating' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl font-bold text-white">{stat.value}</div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
          <div className="w-1 h-2 bg-white/50 rounded-full"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
