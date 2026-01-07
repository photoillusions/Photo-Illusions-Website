import React from 'react';
import { Facebook, Instagram, Twitter, Mail, MapPin, Phone } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 text-gray-600 pt-20 pb-10 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            
            {/* Brand */}
            <div className="space-y-6">
                <h3 className="text-2xl font-serif font-bold text-gray-900">PHOTO ILLUSIONS</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                    Premium On-Site Digital Photography Studio services for weddings, corporate events, and parties. We capture the magic in every shot.
                </p>
                <div className="flex space-x-4">
                    <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors"><Instagram size={20} /></a>
                    <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors"><Facebook size={20} /></a>
                    <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors"><Twitter size={20} /></a>
                </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-6">
                <h4 className="text-sm font-bold uppercase tracking-widest text-gray-900 border-b border-gray-300 pb-2 inline-block">Explore</h4>
                <ul className="space-y-3 text-sm text-gray-500">
                    <li><a href="#" className="hover:text-blue-600 transition-colors">Home</a></li>
                    <li><a href="#about" className="hover:text-blue-600 transition-colors">About Us</a></li>
                    <li><a href="#services" className="hover:text-blue-600 transition-colors">Packages & Pricing</a></li>
                    <li><a href="#contact" className="hover:text-blue-600 transition-colors">Book Now</a></li>
                </ul>
            </div>

            {/* Contact */}
            <div className="space-y-6">
                <h4 className="text-sm font-bold uppercase tracking-widest text-gray-900 border-b border-gray-300 pb-2 inline-block">Contact</h4>
                <div className="space-y-4 text-sm text-gray-500">
                    <div className="flex items-start gap-3">
                        <MapPin size={18} className="text-blue-600 mt-0.5" />
                        <span>Mt. Holly, NJ</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Phone size={18} className="text-blue-600" />
                        <span>856-577-0236</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Mail size={18} className="text-blue-600" />
                        <span>Photoillusions@comcast.net</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="mt-20 pt-8 border-t border-gray-200 text-center text-xs text-gray-500">
            <p>&copy; {new Date().getFullYear()} Photo Illusions. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;