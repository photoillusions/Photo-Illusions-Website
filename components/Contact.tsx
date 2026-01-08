import React from 'react';
import { ExternalLink } from 'lucide-react';

const Contact: React.FC = () => {
    return (
        <section id="contact" className="py-24 bg-gray-50 text-gray-900 border-t border-gray-200">
             <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-serif text-gray-900 mb-4 font-bold">Book Your Date</h2>
                    <p className="text-blue-600 uppercase tracking-widest text-sm font-bold">Ready to Rock?</p>
                </div>
                
                <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl border border-gray-100 text-center space-y-8">
                     {/* Service Description Box */}
                    <div className="bg-blue-50 border border-blue-100 p-6 rounded-lg">
                        <p className="text-gray-700 text-lg leading-relaxed max-w-2xl mx-auto">
                            We are an <strong>On-Site Digital Photographer Printers and Designers</strong>. 
                            We do not Cover Events. We Set up at events and Print Professional Photos for the Guests.
                        </p>
                    </div>

                    <div className="py-4">
                        <p className="text-lg text-gray-700 mb-6 font-medium">To book your event, please complete our secure registration form.</p>
                        <a 
                            href="https://photo-illusions-customer-registration.onrender.com/Form.html" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-3 px-8 py-4 md:px-12 md:py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-widest text-sm md:text-lg transition-all transform hover:-translate-y-1 hover:shadow-2xl rounded-lg shadow-lg shadow-blue-500/20"
                        >
                            GO TO REGISTRATION FORM <ExternalLink size={20} />
                        </a>
                        <p className="mt-4 text-xs text-gray-400">Opens in a new window</p>
                    </div>
                </div>
             </div>
        </section>
    );
};

export default Contact;
