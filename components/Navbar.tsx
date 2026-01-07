import React, { useState } from 'react';
import { Phone, Menu, X, Aperture } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: 'Home', href: '#' },
    { name: 'About', href: '#about' },
    { name: 'Our Services', href: '#services' },
    { name: 'Contact Us', href: '#contact' },
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex flex-col items-center cursor-pointer group">
            <div className="text-gray-900 flex items-center gap-3 transition-transform group-hover:scale-105 duration-500">
                <Aperture size={32} strokeWidth={1.5} className="text-blue-600" />
                <span className="font-serif font-bold text-xl tracking-widest text-black">PHOTO ILLUSIONS</span>
            </div>
            <span className="text-[0.6rem] tracking-[0.2em] text-gray-500 uppercase mt-1 font-medium">— On-Site DIGITAL PHOTOGRAPHY STUDIO —</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="flex space-x-1 text-sm font-medium tracking-wide">
              {navLinks.map((link, index) => (
                <React.Fragment key={link.name}>
                  <a href={link.href} className="text-gray-900 hover:text-blue-600 transition-colors px-4 py-2 font-semibold">
                    {link.name}
                  </a>
                  {index < navLinks.length - 1 && (
                    <span className="text-gray-300 py-2">|</span>
                  )}
                </React.Fragment>
              ))}
            </div>
            <button className="flex items-center gap-2 px-6 py-2 border border-gray-900 rounded hover:bg-gray-900 hover:text-white transition-all text-sm tracking-widest text-gray-900 font-bold">
              CONTACT US <Phone size={14} />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-900 p-2">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 absolute w-full shadow-xl">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 text-center">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="block px-3 py-4 text-base font-medium text-gray-900 hover:text-blue-600 border-b border-gray-100"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <div className="pt-4 pb-4">
                 <button className="mx-auto flex items-center gap-2 px-6 py-3 border border-blue-600 text-blue-600 rounded hover:bg-blue-600 hover:text-white transition-all text-sm tracking-widest w-fit">
                  CALL NOW <Phone size={16} />
                </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;