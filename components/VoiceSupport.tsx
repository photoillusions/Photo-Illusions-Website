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

IMPORTANT: After asking a question, wait for the customer to fully respond before speaking again. Give them time to answer, especially for details like email addresses or phone numbers.

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
If the user expresses interest in booking, checking availability, or joining, you MUST collect the following information ONE BY ONE. Do not ask multiple questions at once. Wait for the user to FULLY answer before moving to the next question. Be patient.

1. First Name
2. Event Title (e.g., Wedding, Gala, Birthday)
3. Venue Location (City and State)
4. Date of the Event
5. Guest Count
6. Email Address (ask them to speak it slowly and clearly)

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
  
  // Audio recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isRecordingRef = useRef(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastAudioLevelRef = useRef(0);
  const aiAudioChunksRef = useRef<string[]>([]);

  // Gemini session ref
  const sessionRef = useRef<any>(null);

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
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (inputContextRef.current) inputContextRef.current.close();
    if (outputContextRef.current) outputContextRef.current.close();
    if (processorRef.current) processorRef.current.disconnect();
    if (sourceRef.current) sourceRef.current.disconnect();

    inputContextRef.current = null;
    outputContextRef.current = null;
    streamRef.current = null;
    processorRef.current = null;
    sourceRef.current = null;
    mediaRecorderRef.current = null;
    sessionRef.current = null;
    nextStartTimeRef.current = 0;
    audioChunksRef.current = [];
    aiAudioChunksRef.current = [];
    isRecordingRef.current = false;
    setStatus('idle');
    setMessages([]);
  };

  const saveAudioToSupabase = async (role: 'user' | 'model', audioBase64: string) => {
    if (!audioBase64) return;
    
    try {
      console.log(`💾 Saving ${role} audio to Supabase (${Math.round(audioBase64.length / 1024)}KB)`);

      const { error } = await supabase
        .from('voice_support_interactions')
        .insert([{
          session_id: sessionId,
          role,
          content: audioBase64,
          mode: 'voice'
        }]);

      if (error) {
        console.error('Supabase error:', error.message);
      } else {
        console.log(`✓ ${role} audio saved`);
      }
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  const saveTextToSupabase = async (role: 'user' | 'model', text: string, chatMode: 'voice' | 'text') => {
    if (!text || text.trim() === '') return;
    
    try {
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
      }
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Remove the data URL prefix to get just the base64
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const startUserRecording = () => {
    if (!streamRef.current || isRecordingRef.current) return;
    
    audioChunksRef.current = [];
    isRecordingRef.current = true;

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const base64 = await blobToBase64(audioBlob);
          saveAudioToSupabase('user', base64);
        }
        audioChunksRef.current = [];
        isRecordingRef.current = false;
      };

      mediaRecorder.start(100); // Collect data every 100ms
      mediaRecorderRef.current = mediaRecorder;
      console.log('🎙️ Started recording user audio');
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const stopUserRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      console.log('⏹️ Stopped recording user audio');
    }
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

      // Track if user is speaking (for 2-second delay)
      let userSpeakingTimeout: NodeJS.Timeout | null = null;
      let audioBuffer: { data: string; mimeType: string }[] = [];
      let isSendingAudio = false;

      const session = await ai.live.connect({
        model: 'gemini-2.0-flash-exp',
        callbacks: {
          onopen: () => {
            setStatus('listening');
            startUserRecording();

            if (!inputContextRef.current) return;
            const source = inputContextRef.current.createMediaStreamSource(stream);
            const processor = inputContextRef.current.createScriptProcessor(4096, 1, 1);

            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Calculate audio level
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) {
                sum += Math.abs(inputData[i]);
              }
              const avgLevel = sum / inputData.length;
              lastAudioLevelRef.current = avgLevel;

              const pcmBlob = createBlob(inputData);
              
              // Detect if user is speaking (threshold)
              const isSpeaking = avgLevel > 0.01;
              
              if (isSpeaking) {
                // User is speaking - buffer the audio
                audioBuffer.push(pcmBlob);
                
                // Clear any existing timeout
                if (userSpeakingTimeout) {
                  clearTimeout(userSpeakingTimeout);
                }
                
                // Set new timeout - wait 2 seconds of silence before sending
                userSpeakingTimeout = setTimeout(() => {
                  if (audioBuffer.length > 0 && !isSendingAudio) {
                    isSendingAudio = true;
                    console.log('📤 Sending buffered audio after 2s silence');
                    
                    // Send all buffered audio
                    audioBuffer.forEach(chunk => {
                      session.sendRealtimeInput({ media: chunk });
                    });
                    audioBuffer = [];
                    
                    setTimeout(() => {
                      isSendingAudio = false;
                    }, 500);
                  }
                }, 2000); // 2 second delay
              } else if (!isSendingAudio && audioBuffer.length === 0) {
                // Not speaking and no buffer - send ambient audio to keep connection
                session.sendRealtimeInput({ media: pcmBlob });
              }
            };

            source.connect(processor);
            processor.connect(inputContextRef.current.destination);

            sourceRef.current = source;
            processorRef.current = processor;
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Handle audio data from model
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && outputContextRef.current) {
              setStatus('speaking');
              
              // Stop user recording while AI speaks
              stopUserRecording();
              
              // Collect AI audio for saving
              aiAudioChunksRef.current.push(audioData);

              const audioBuffer = await decodeAudioData(
                decode(audioData),
                outputContextRef.current,
                24000,
                1
              );
              playAudio(audioBuffer);
            }

            if (msg.serverContent?.turnComplete) {
              // Save AI's complete audio response
              if (aiAudioChunksRef.current.length > 0) {
                const combinedAudio = aiAudioChunksRef.current.join('');
                saveAudioToSupabase('model', combinedAudio);
                aiAudioChunksRef.current = [];
              }
              
              // Resume user recording after a short delay
              setTimeout(() => {
                setStatus('listening');
                startUserRecording();
              }, 500);
            }

            if (msg.serverContent?.interrupted) {
              nextStartTimeRef.current = 0;
              aiAudioChunksRef.current = [];
              setStatus('listening');
              startUserRecording();
            }
          },
          onclose: () => {
            setStatus('idle');
            stopUserRecording();
          },
          onerror: (err) => {
            console.error("Voice Error", err);
            stopUserRecording();
            setMode('text');
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: SYSTEM_INSTRUCTION,
        }
      });

      sessionRef.current = session;

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
        // Audio finished playing
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
    saveTextToSupabase('user', userMessage, 'text');
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
      saveTextToSupabase('model', text, 'text');
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
                {status === 'listening' ? "Take your time - I'll wait for you to finish." :
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
