import React from 'react';
import { Mic } from 'lucide-react';

interface HeroProps {
  onSupportClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ onSupportClick }) => {
  // Using the thumbnail endpoint with a large size (sz=w1920) is often more reliable for embedding than export=view
  const collageImages = [
    "https://drive.google.com/thumbnail?id=18GNdiFjZfC9uTSAz0Y4yEsQkEXFEzQFH&sz=w1920",
    "https://drive.google.com/thumbnail?id=1SBDOCJzaQklPp9ud942gj0gCIz1Jcaib&sz=w1920",
    "https://drive.google.com/thumbnail?id=19wTuXpEg9eKMl58NkB788ryf5t_fXzI4&sz=w1920",
    "https://drive.google.com/thumbnail?id=1s6YxDazLJMinvf8eA6hc0xbn-rja6J6P&sz=w1920",
    "https://drive.google.com/thumbnail?id=1LYg0E6bFlGceSKa97Hdghhex5R52_cPi&sz=w1920"
  ];

  return (
    <div className="relative h-screen w-full overflow-hidden bg-white">
      <style>{`
        @keyframes slideInLeft {
          0% { transform: translateX(-100px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInRight {
          0% { transform: translateX(100px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInUp {
          0% { transform: translateY(50px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes zoomIn {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .animate-box {
          animation: zoomIn 1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .animate-left {
          animation: slideInLeft 1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          animation-delay: 0.5s;
          opacity: 0;
        }
        .animate-right {
          animation: slideInRight 1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          animation-delay: 0.7s;
          opacity: 0;
        }
        .animate-up {
          animation: slideInUp 1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          animation-delay: 1s;
          opacity: 0;
        }
      `}</style>

      {/* Background Collage */}
      <div className="absolute inset-0 grid grid-cols-6 grid-rows-2 gap-0 opacity-80">
         {/* Top Row: 3 images, col-span-2 each */}
         <div className="col-span-3 md:col-span-2 relative overflow-hidden group">
            <img 
                src={collageImages[0]} 
                alt="Photobooth collage 1" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-1000 ease-in-out" 
            />
         </div>
         <div className="col-span-3 md:col-span-2 relative overflow-hidden group">
            <img 
                src={collageImages[1]} 
                alt="Photobooth collage 2" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-1000 ease-in-out" 
            />
         </div>
         <div className="hidden md:block col-span-2 relative overflow-hidden group">
            <img 
                src={collageImages[2]} 
                alt="Photobooth collage 3" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-1000 ease-in-out" 
            />
         </div>

         {/* Bottom Row: 2 images, col-span-3 each */}
         <div className="col-span-3 relative overflow-hidden group">
            <img 
                src={collageImages[3]} 
                alt="Photobooth collage 4" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-1000 ease-in-out" 
            />
         </div>
         <div className="col-span-3 relative overflow-hidden group">
            <img 
                src={collageImages[4]} 
                alt="Photobooth collage 5" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-1000 ease-in-out" 
            />
         </div>
      </div>

      {/* Gradient Overlay for Text Readability - White based */}
      <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-white/60"></div>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div className="animate-box relative w-full max-w-4xl p-8 md:p-12 border-2 border-blue-500/30 bg-white/90 backdrop-blur-md shadow-2xl rounded-sm">
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-600"></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-600"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-600"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-600"></div>

            <div className="text-center space-y-6 overflow-hidden">
                <div className="animate-left">
                  <h1 className="text-3xl md:text-5xl font-serif text-gray-900 tracking-wide relative inline-block pb-2 drop-shadow-sm">
                      Your #1 Source for On-Site Digital Photography!
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-1 bg-blue-500 rounded-full"></span>
                  </h1>
                </div>
                
                <div className="animate-right">
                  <p className="text-lg md:text-2xl text-blue-600 font-medium max-w-2xl mx-auto leading-relaxed">
                      It's not AI, It's Photo Illusions!
                  </p>
                </div>

                <div className="animate-up flex flex-col sm:flex-row gap-6 justify-center pt-8">
                    <button className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-widest text-sm transition-all transform hover:scale-105 shadow-lg shadow-blue-500/30 rounded-sm">
                        BOOK ONLINE
                    </button>
                    <button 
                        onClick={onSupportClick}
                        className="px-8 py-4 bg-transparent border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white font-medium tracking-widest text-sm transition-all rounded-sm flex items-center justify-center gap-2"
                    >
                        TALK TO SUPPORT <Mic size={18} />
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Side Social Handle */}
      <div className="hidden lg:block absolute right-8 top-1/2 transform -translate-y-1/2 rotate-90 origin-right z-10">
        <span className="text-xs tracking-[0.5em] text-gray-300 font-bold mix-blend-multiply">@PHOTOILLUSIONS</span>
      </div>
    </div>
  );
};

export default Hero;