import React from 'react';

const Gallery: React.FC = () => {
  // Using Google Drive thumbnail endpoint for reliable loading
  const images = [
    "https://drive.google.com/thumbnail?id=12ndzllOH9dlrG-OIp_3m0iXlEtMdKFVO&sz=w800",
    "https://drive.google.com/thumbnail?id=1F9ybflMa5WyQjz1KncDtgo-c4Uuuh14j&sz=w800",
    "https://drive.google.com/thumbnail?id=1zoAJv7sctFvPEljDeUc4I_GirHPplna9&sz=w800",
    "https://drive.google.com/thumbnail?id=1jzy8yMLOuwGjtED04fZ2FmRKXaMCcQr_&sz=w800",
    "https://drive.google.com/thumbnail?id=1AWFTHp47gEig-zCjyAvbmu9cnvq6l3_t&sz=w800",
    "https://drive.google.com/thumbnail?id=1tl75QFDFM9pKxMAGeRpT3EHE_Y_WRfhd&sz=w800",
    "https://drive.google.com/thumbnail?id=1wdsHGkg9HGmm_O0zHL4f0UPMyxDnWqpW&sz=w800",
    "https://drive.google.com/thumbnail?id=1ECY2mnCZRuJQtotQ-FCBDJHe_MAcRZ98&sz=w800",
    "https://drive.google.com/thumbnail?id=1HPsVz6ZstJpujF4gJoXpv7SZIcalqZJK&sz=w800",
    "https://drive.google.com/thumbnail?id=1ezGRXgepyGgK39JEgoYA37qhyW1iv0nt&sz=w800"
  ];

  return (
    <section id="gallery" className="py-24 bg-gray-100 text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif text-blue-600 mb-4 font-bold">The Gallery</h2>
            <p className="text-gray-600 max-w-2xl mx-auto font-medium">Digital Photography Entertainment Experience, to the 1000th Power!!!</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {images.map((src, i) => (
                <div key={i} className="relative aspect-square overflow-hidden group rounded-lg border border-gray-200 shadow-sm bg-white">
                    <img 
                        src={src} 
                        alt={`Gallery ${i}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                    />
                    <div className="absolute inset-0 border-4 border-blue-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-lg"></div>
                </div>
            ))}
        </div>
      </div>
    </section>
  );
};

export default Gallery;