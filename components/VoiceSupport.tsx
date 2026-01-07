import React, { useState } from 'react';
import { X, MessageCircle, Send, Bot } from 'lucide-react';

interface VoiceSupportProps {
  isOpen: boolean;
  onClose: () => void;
}

const VoiceSupport: React.FC<VoiceSupportProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: "Hi! I'm the Photo Illusions assistant. How can I help you today? I can answer questions about our services, pricing, and availability."
    }
  ]);
  const [input, setInput] = useState('');

  const quickResponses: Record<string, string> = {
    'pricing': 'Our packages range from $150-$650 depending on services selected. The basic Photo Booth package starts at $150, while our full Fashion Event Photography package is $650. Would you like more details on a specific package?',
    'services': 'We offer three main services: On-Site Photo Booth with instant digital sharing, On-Site Digital Printing with professional 8x10 prints, and Fashion Event Photography with high-end glamour shots. All services include AI-enhanced portrait options!',
    'location': 'We\'re based in Mt. Holly, NJ and serve the greater South Jersey and Philadelphia areas. We travel to your event location with our full mobile studio setup.',
    'book': 'To book an event, you can fill out the contact form on this page, call us at (609) 555-5555, or email info@photoillusions.com. We recommend booking at least 2-3 weeks in advance for best availability.',
    'ai': 'Our AI enhancement service transforms your photos into stunning, magazine-quality portraits. We use advanced AI technology to enhance lighting, skin tones, and overall image quality while maintaining natural looks.',
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = input.toLowerCase();
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');

    // Simple keyword matching for demo
    setTimeout(() => {
      let response = "Thanks for your question! For specific inquiries, please fill out our contact form or call us at (609) 555-5555. We'd love to discuss your event needs!";
      
      for (const [keyword, answer] of Object.entries(quickResponses)) {
        if (userMessage.includes(keyword)) {
          response = answer;
          break;
        }
      }

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="font-bold">Photo Illusions Assistant</h3>
              <p className="text-sm text-blue-100">Ask me anything!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-2 bg-white border-t border-gray-100">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['Pricing', 'Services', 'Location', 'Book'].map((action) => (
              <button
                key={action}
                onClick={() => {
                  setInput(action);
                  setTimeout(() => handleSend(), 100);
                }}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 whitespace-nowrap transition-colors"
              >
                {action}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-300 text-white rounded-full transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceSupport;
