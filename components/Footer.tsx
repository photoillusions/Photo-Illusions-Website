import React from 'react';
import { Camera, Instagram, Facebook, Twitter } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Camera className="w-8 h-8 text-blue-500" />
              <span className="text-2xl font-serif font-bold text-white">
                Photo<span className="text-blue-500">Illusions</span>
              </span>
            </div>
            <p className="text-gray-400 leading-relaxed mb-6 max-w-md">
              Professional on-site photography studio bringing Hollywood glamour to events across New Jersey. 
              AI-enhanced portraits delivered instantly.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors">
                <Facebook size={18} />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors">
                <Twitter size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#services" className="hover:text-blue-400 transition-colors">Services</a></li>
              <li><a href="#gallery" className="hover:text-blue-400 transition-colors">Gallery</a></li>
              <li><a href="#contact" className="hover:text-blue-400 transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-bold mb-4">Services</h4>
            <ul className="space-y-2">
              <li><span className="hover:text-blue-400 transition-colors">Photo Booth</span></li>
              <li><span className="hover:text-blue-400 transition-colors">Event Photography</span></li>
              <li><span className="hover:text-blue-400 transition-colors">Portrait Sessions</span></li>
              <li><span className="hover:text-blue-400 transition-colors">AI Enhancement</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © {currentYear} Photo Illusions. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm">
            Serving Mt. Holly, NJ and surrounding areas
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
