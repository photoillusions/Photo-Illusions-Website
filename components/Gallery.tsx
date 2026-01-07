import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const galleryImages = [
  {
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
    title: 'Wedding Photography',
    category: 'Weddings'
  },
  {
    url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800',
    title: 'Corporate Events',
    category: 'Corporate'
  },
  {
    url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    title: 'Gala Nights',
    category: 'Events'
  },
  {
    url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
    title: 'Celebration Moments',
    category: 'Parties'
  },
  {
    url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800',
    title: 'Professional Portraits',
    category: 'Portraits'
  },
  {
    url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
    title: 'Festival Coverage',
    category: 'Events'
  },
];

const Gallery: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const openLightbox = (index: number) => setSelectedImage(index);
  const closeLightbox = () => setSelectedImage(null);
  
  const nextImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage + 1) % galleryImages.length);
    }
  };
  
  const prevImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage - 1 + galleryImages.length) % galleryImages.length);
    }
  };

  return (
    <section id="gallery" className="py-24 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
            Our Portfolio
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Browse through our collection of stunning event photography and AI-enhanced portraits.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryImages.map((image, index) => (
            <div
              key={index}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl cursor-pointer"
              onClick={() => openLightbox(index)}
            >
              <img
                src={image.url}
                alt={image.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="text-blue-400 text-sm font-medium">{image.category}</span>
                  <h3 className="text-white text-xl font-bold">{image.title}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {selectedImage !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
          >
            <X size={32} />
          </button>
          
          <button
            onClick={prevImage}
            className="absolute left-4 text-white/80 hover:text-white p-2"
          >
            <ChevronLeft size={48} />
          </button>

          <img
            src={galleryImages[selectedImage].url}
            alt={galleryImages[selectedImage].title}
            className="max-w-[90vw] max-h-[85vh] object-contain"
          />

          <button
            onClick={nextImage}
            className="absolute right-4 text-white/80 hover:text-white p-2"
          >
            <ChevronRight size={48} />
          </button>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
            <span className="text-blue-400 text-sm">{galleryImages[selectedImage].category}</span>
            <h3 className="text-white text-2xl font-bold">{galleryImages[selectedImage].title}</h3>
          </div>
        </div>
      )}
    </section>
  );
};

export default Gallery;
