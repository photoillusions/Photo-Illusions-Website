import React, { useEffect, useState, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { X, Mic, Send, MessageSquare, MicOff, Volume2, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface VoiceSupportProps {
  isOpen: boolean;
  onClose: () => void;
}

const SYSTEM_INSTRUCTION = `You are the AI Voice Assistant for Photo Illusions, a premium On-Site Digital Photography Studio. 
Your persona is Friendly, Professional, Excited, and Confident.
Keep your answers short, clear, and concise. Do not give long explanations.

Knowledge Base:
- Services: We are strictly an On-Site Photo Booth, On-Site Digital Photo Printing, and Fashion Event Photography service. We DO NOT cover general event photography.
- Pricing: The booking fee is $150, plus $10 per 8x10 print.
- AI Add-on Pricing: $250.
- Duration: We stay for at least 3 hours, sometimes longer if demand is high. We must be on location at the start of the event for setup.
- Missing Photos: Please allow up to 3 business days after the event is over.
- Location: We are located in Mt. Holly, NJ.
- Service Area: We ONLY travel to NY, NJ, PA, DE, Baltimore, DC, Virginia, and NC.
- Booking: To book, please use the Registration Form button in the Contact section of our website.

Booking Workflow:
If the user expresses interest in booking, checking availability, or joining, you MUST collect the following information ONE BY ONE. Do not ask multiple questions at once. Wait for the user to answer before moving to the next question.

1. First Name
2. Event Title (e.g., Wedding, Gala, Birthday)
3. Venue Location (City and State)
4. Date of the Event
5. Guest Count
6. Email Address

After collecting all 6 items:
1. Summarize the details back to the user to confirm they are correct.
2. Instruct the user to please submit the official Booking Form on the website to finalize the request.

Rules:
- If the user asks about a location, only confirm or deny based on the Service Area list.
- Do not mention Michigan.
- If asked about general event coverage (like roaming photography for a wedding), politely clarify that we only do Photo Booths, Printing Stations, and Fashion Event Photography.
- DO NOT mention the AI Add-on pricing unless the customer specifically asks about AI features.

If the user asks something else, answer briefly and professionally acting as a helpful representative of Photo Illusions.`;

const VoiceSupport: React.FC<VoiceSupportProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'voice' | 'text'>('voice');
  const [status, setStatus] = useState<'connecting' | 'listening' | 'speaking' | 'idle' | 'error'>('idle');
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [inputText, setInputText] = useState('');
  const [sessionId] = useState(() => crypto.randomUUID());

  // Refs for Audio
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef(0);
  
  // Web Speech API for transcription
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMode('text');
      } else {
        startVoiceSession();
      }
    } else {
      cleanup();
    }
    return () => cleanup();
  }, [isOpen]);

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (inputContextRef.current) inputContextRef.current.close();
    if (outputContextRef.current) outputContextRef.current.close();
    if (processorRef.current) processorRef.current.disconnect();
    if (sourceRef.current) sourceRef.current.disconnect();
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
      recognitionRef.current = null;
    }

    inputContextRef.current = null;
    outputContextRef.current = null;
    streamRef.current = null;
    processorRef.current = null;
    sourceRef.current = null;
    nextStartTimeRef.current = 0;
    setStatus('idle');
    setMessages([]);
  };

  const saveMessageToSupabase = async (role: 'user' | 'model', text: string, chatMode: 'voice' | 'text') => {
    if (!text || text.trim() === '') return;
    
    try {
      console.log('💾 Saving to Supabase:', role, '-', text.substring(0, 50));

      const { error } = await supabase
        .from('voice_support_interactions')
        .insert([{
          session_id: sessionId,
          role,
          content: text.trim(),
          mode: chatMode
        }]);

      if (error) {
        console.error('Supabase error:', error.message);
      } else {
        console.log('✓ Saved to Supabase');
      }
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  // Setup Web Speech API for USER transcription only
  const setupSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported - user voice will not be transcribed');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false; // Only final results
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const transcript = event.results[i][0].transcript.trim();
          if (transcript) {
            console.log('🎤 User said:', transcript);
            setMessages(prev => [...prev, { role: 'user', text: transcript }]);
            saveMessageToSupabase('user', transcript, 'voice');
          }
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        console.error('Speech recognition error:', event.error);
      }
    };

    recognition.onend = () => {
      // Auto-restart if still in voice mode and listening
      if (recognitionRef.current && status !== 'idle') {
        setTimeout(() => {
          try {
            recognitionRef.current?.start();
          } catch (e) {}
        }, 100);
      }
    };

    return recognition;
  };

  const startVoiceSession = async () => {
    setStatus('connecting');
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      inputContextRef.current = new AudioContextClass({ sampleRate: 16000 });
      outputContextRef.current = new AudioContextClass({ sampleRate: 24000 });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Setup speech recognition for transcription
      recognitionRef.current = setupSpeechRecognition();

      const session = await ai.live.connect({
        model: 'gemini-2.0-flash-exp',
        callbacks: {
          onopen: () => {
            setStatus('listening');

            // Start speech recognition for transcription
            if (recognitionRef.current) {
              try {
                recognitionRef.current.start();
                console.log('🎙️ Speech recognition started');
              } catch (e) {}
            }

            if (!inputContextRef.current) return;
            const source = inputContextRef.current.createMediaStreamSource(stream);
            const processor = inputContextRef.current.createScriptProcessor(4096, 1, 1);

            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              session.sendRealtimeInput({ media: pcmBlob });
            };

            source.connect(processor);
            processor.connect(inputContextRef.current.destination);

            sourceRef.current = source;
            processorRef.current = processor;
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Handle audio data from model - THIS IS THE KEY PART
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && outputContextRef.current) {
              setStatus('speaking');
              const audioBuffer = await decodeAudioData(
                decode(audioData),
                outputContextRef.current,
                24000,
                1
              );
              playAudio(audioBuffer);
            }

            // Check for text in the response (for logging/saving)
            const modelText = msg.serverContent?.modelTurn?.parts?.find(p => p.text)?.text;
            if (modelText) {
              console.log('🤖 AI said:', modelText);
              setMessages(prev => [...prev, { role: 'model', text: modelText }]);
              saveMessageToSupabase('model', modelText, 'voice');
            }

            if (msg.serverContent?.turnComplete) {
              setStatus('listening');
            }

            if (msg.serverContent?.interrupted) {
              nextStartTimeRef.current = 0;
              setStatus('listening');
            }
          },
          onclose: () => {
            setStatus('idle');
          },
          onerror: (err) => {
            console.error("Voice Error", err);
            setMode('text');
          }
        },
        config: {
          responseModalities: [Modality.AUDIO], // AUDIO ONLY - this is key!
          systemInstruction: SYSTEM_INSTRUCTION,
        }
      });

    } catch (err) {
      console.error("Failed to start voice session", err);
      setMode('text');
    }
  };

  const playAudio = (buffer: AudioBuffer) => {
    if (!outputContextRef.current) return;

    const source = outputContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(outputContextRef.current.destination);

    const currentTime = outputContextRef.current.currentTime;
    const startTime = Math.max(currentTime, nextStartTimeRef.current);

    source.start(startTime);
    nextStartTimeRef.current = startTime + buffer.duration;

    source.onended = () => {
      if (outputContextRef.current && outputContextRef.current.currentTime >= nextStartTimeRef.current) {
        setStatus('listening');
      }
    };
  };

  function createBlob(data: Float32Array) {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    const uint8 = new Uint8Array(int16.buffer);
    let binary = '';
    const len = uint8.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    return {
      data: btoa(binary),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    const newMessages = [...messages, { role: 'user' as const, text: userMessage }];
    setMessages(newMessages);
    saveMessageToSupabase('user', userMessage, 'text');
    setInputText('');
    setStatus('speaking');

    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
      const chatHistory = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model' as const,
        parts: [{ text: msg.text }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        config: { systemInstruction: SYSTEM_INSTRUCTION },
        contents: [
          ...chatHistory,
          { role: 'user', parts: [{ text: userMessage }] }
        ]
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";
      setMessages([...newMessages, { role: 'model', text }]);
      saveMessageToSupabase('model', text, 'text');
    } catch (err) {
      console.error("Text chat error", err);
      setMessages([...newMessages, { role: 'model', text: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setStatus('idle');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[500px] border border-gray-200">

        <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-yellow-300" />
            <h3 className="font-bold tracking-wide">Photo Illusions Assistant</h3>
          </div>
          <button onClick={onClose} className="hover:bg-blue-500 p-1 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {mode === 'voice' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8 bg-gradient-to-b from-white to-blue-50">
            <div className="relative">
              {status === 'speaking' && (
                <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20"></div>
              )}
              {status === 'listening' && (
                <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-20"></div>
              )}

              <div className={`w-32 h-32 rounded-full flex items-center justify-center shadow-xl transition-all duration-500 ${
                status === 'listening' ? 'bg-red-500 scale-110' :
                status === 'speaking' ? 'bg-blue-500 scale-110' :
                status === 'connecting' ? 'bg-gray-400' : 'bg-blue-600'
              }`}>
                {status === 'listening' ? <Mic size={48} className="text-white animate-pulse" /> :
                  status === 'speaking' ? <Volume2 size={48} className="text-white animate-bounce" /> :
                  status === 'connecting' ? <Loader2 size={48} className="text-white animate-spin" /> :
                  <MicOff size={48} className="text-white" />}
              </div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-800">
                {status === 'listening' ? "I'm Listening..." :
                  status === 'speaking' ? "Speaking..." :
                  status === 'connecting' ? "Connecting..." : "Ready"}
              </h2>
              <p className="text-gray-500 text-sm">
                {status === 'listening' ? "Ask me about prices, New York trips, or missing photos!" :
                  status === 'speaking' ? "Listen to the answer." : "Please wait a moment."}
              </p>
            </div>

            <button onClick={() => setMode('text')} className="text-sm text-blue-600 underline mt-4 hover:text-blue-800">
              Switch to Text Chat
            </button>
          </div>
        )}

        {mode === 'text' && (
          <div className="flex-1 flex flex-col bg-gray-50">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-400 mt-10">
                  <MessageSquare size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Hi! Ask me about our photography services.</p>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg p-3 text-sm ${
                    msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {status === 'speaking' && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-500 border border-gray-200 shadow-sm rounded-lg p-3 text-xs flex items-center gap-2">
                    <Loader2 size={12} className="animate-spin" /> Typing...
                  </div>
                </div>
              )}
            </div>
            <form onSubmit={handleTextSubmit} className="p-4 bg-white border-t border-gray-200 flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition-colors">
                <Send size={18} />
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default VoiceSupport;
