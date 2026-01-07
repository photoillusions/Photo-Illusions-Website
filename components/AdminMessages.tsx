import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { MessageSquare, Clock, ArrowLeft, RefreshCw, Play, Pause, Volume2, User } from 'lucide-react';

interface Interaction {
    id: number;
    session_id: string;
    role: 'user' | 'model';
    content: string;
    created_at: string;
    mode?: 'voice' | 'text';
}

interface AdminMessagesProps {
    onBack: () => void;
}

const AudioPlayer: React.FC<{ base64Audio: string; isUserAudio: boolean }> = ({ base64Audio, isUserAudio }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const playAudio = async () => {
        if (isPlaying && audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
            return;
        }

        try {
            // Determine mime type based on content
            let mimeType = 'audio/webm';
            let audioData = base64Audio;
            
            // Check if it's PCM data (from AI) or WebM (from user)
            // User recordings are WebM, AI responses are raw PCM
            if (!isUserAudio) {
                // AI audio is PCM - need to convert or use Web Audio API
                mimeType = 'audio/pcm';
            }

            // For WebM (user audio), we can play directly
            if (isUserAudio) {
                const audioBlob = new Blob(
                    [Uint8Array.from(atob(audioData), c => c.charCodeAt(0))],
                    { type: 'audio/webm' }
                );
                const audioUrl = URL.createObjectURL(audioBlob);
                
                if (audioRef.current) {
                    audioRef.current.src = audioUrl;
                } else {
                    audioRef.current = new Audio(audioUrl);
                }
                
                audioRef.current.onended = () => setIsPlaying(false);
                audioRef.current.onerror = () => {
                    setError(true);
                    setIsPlaying(false);
                };
                
                await audioRef.current.play();
                setIsPlaying(true);
            } else {
                // For AI PCM audio, use Web Audio API
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                
                const binaryString = atob(audioData);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                
                // Convert to Int16 then Float32
                const int16Data = new Int16Array(bytes.buffer);
                const floatData = new Float32Array(int16Data.length);
                for (let i = 0; i < int16Data.length; i++) {
                    floatData[i] = int16Data[i] / 32768.0;
                }
                
                const audioBuffer = audioContext.createBuffer(1, floatData.length, 24000);
                audioBuffer.getChannelData(0).set(floatData);
                
                const source = audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContext.destination);
                source.onended = () => setIsPlaying(false);
                source.start();
                setIsPlaying(true);
            }
        } catch (err) {
            console.error('Error playing audio:', err);
            setError(true);
        }
    };

    if (error) {
        return <span className="text-xs text-gray-400">Audio unavailable</span>;
    }

    return (
        <button
            onClick={playAudio}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all ${
                isPlaying 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
        >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            {isPlaying ? 'Playing...' : 'Play'}
        </button>
    );
};

const AdminMessages: React.FC<AdminMessagesProps> = ({ onBack }) => {
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMessages = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('voice_support_interactions')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setInteractions(data || []);
        } catch (err: any) {
            console.error('Error fetching messages:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    // Check if content is base64 audio (starts with certain patterns or is very long)
    const isAudioContent = (content: string): boolean => {
        // Base64 audio is typically very long and doesn't contain spaces
        return content.length > 500 && !content.includes(' ') && /^[A-Za-z0-9+/=]+$/.test(content.substring(0, 100));
    };

    // Group interactions by session_id
    const groupedInteractions = interactions.reduce((acc, interaction) => {
        if (!acc[interaction.session_id]) {
            acc[interaction.session_id] = [];
        }
        acc[interaction.session_id].push(interaction);
        return acc;
    }, {} as Record<string, Interaction[]>);

    // Sort groups by the latest message in each group
    const sortedSessions = Object.keys(groupedInteractions).sort((a, b) => {
        const lastA = new Date(groupedInteractions[a][0].created_at).getTime();
        const lastB = new Date(groupedInteractions[b][0].created_at).getTime();
        return lastB - lastA;
    });

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <MessageSquare className="text-blue-600" /> AI Assistant Transcripts
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchMessages}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            {loading ? 'Refreshing...' : 'Refresh'}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        Error: {error}
                    </div>
                )}

                {loading && interactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
                        <RefreshCw size={48} className="animate-spin mb-4" />
                        <p className="text-lg">Fetching messages from Supabase...</p>
                    </div>
                ) : interactions.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                        <MessageSquare size={64} className="mx-auto text-gray-300 mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">No messages yet</h2>
                        <p className="text-gray-500">When users chat with the AI Assistant, their transcripts will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {sortedSessions.map(sessionId => {
                            const sessionInteractions = [...groupedInteractions[sessionId]].sort(
                                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                            );
                            const firstMessage = sessionInteractions[0];
                            const lastMessage = sessionInteractions[sessionInteractions.length - 1];

                            // Count voice vs text messages
                            const voiceCount = sessionInteractions.filter(m => m.mode === 'voice' || isAudioContent(m.content)).length;
                            const textCount = sessionInteractions.length - voiceCount;

                            return (
                                <div key={sessionId} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">Session: {sessionId.substring(0, 8)}...</p>
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Clock size={12} /> {new Date(lastMessage.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {voiceCount > 0 && (
                                                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full flex items-center gap-1">
                                                    <Volume2 size={12} /> {voiceCount} Audio
                                                </span>
                                            )}
                                            {textCount > 0 && (
                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                                                    {textCount} Text
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto bg-gray-50/30">
                                        {sessionInteractions.map((msg) => {
                                            const isAudio = isAudioContent(msg.content);
                                            
                                            return (
                                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                                                        msg.role === 'user'
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-white text-gray-800 border border-gray-100'
                                                    }`}>
                                                        <div className="flex items-center justify-between gap-4 mb-2">
                                                            <span className={`font-bold text-[10px] uppercase ${
                                                                msg.role === 'user' ? 'opacity-70' : 'opacity-70'
                                                            }`}>
                                                                {msg.role === 'user' ? 'Customer' : 'AI Assistant'}
                                                            </span>
                                                            {isAudio && (
                                                                <span className={`text-[10px] uppercase flex items-center gap-1 ${
                                                                    msg.role === 'user' ? 'text-blue-200' : 'text-purple-500'
                                                                }`}>
                                                                    <Volume2 size={10} /> Voice
                                                                </span>
                                                            )}
                                                        </div>
                                                        
                                                        {isAudio ? (
                                                            <div className="flex items-center gap-2">
                                                                <AudioPlayer 
                                                                    base64Audio={msg.content} 
                                                                    isUserAudio={msg.role === 'user'} 
                                                                />
                                                                <span className={`text-xs ${
                                                                    msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'
                                                                }`}>
                                                                    {Math.round(msg.content.length / 1024)}KB
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                        )}
                                                        
                                                        <p className={`text-[10px] mt-2 ${
                                                            msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'
                                                        }`}>
                                                            {new Date(msg.created_at).toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminMessages;
