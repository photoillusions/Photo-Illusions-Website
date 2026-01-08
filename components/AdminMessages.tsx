import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { 
  MessageSquare, Clock, ArrowLeft, RefreshCw, Play, Pause, Volume2, User,
  Trash2, RotateCcw, AlertTriangle, CheckCircle, X
} from 'lucide-react';

interface Interaction {
    id: number;
    session_id: string;
    role: 'user' | 'model';
    content: string;
    created_at: string;
    mode?: 'voice' | 'text';
    is_trashed?: boolean;
}

interface AdminMessagesProps {
    onBack: () => void;
}

// Toast notification component
const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
      type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`}>
      {type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
      {message}
      <button onClick={onClose} className="ml-2 hover:opacity-70">
        <X size={16} />
      </button>
    </div>
  );
};

const AudioPlayer: React.FC<{ base64Audio: string; isUserAudio: boolean }> = ({ base64Audio, isUserAudio }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

    const stopCurrentPlayback = () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
        } catch (e) {}
        sourceNodeRef.current = null;
      }
      setIsPlaying(false);
    };

    const playAudio = async () => {
        if (isPlaying) {
            stopCurrentPlayback();
            return;
        }

        try {
            if (isUserAudio) {
                // User audio is WebM - play directly
                const binaryString = atob(base64Audio);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const audioBlob = new Blob([bytes], { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);
                
                const audio = new Audio(audioUrl);
                audioRef.current = audio;
                
                audio.onended = () => {
                  setIsPlaying(false);
                  URL.revokeObjectURL(audioUrl);
                };
                audio.onerror = () => {
                    setError(true);
                    setIsPlaying(false);
                };
                
                await audio.play();
                setIsPlaying(true);
            } else {
                // AI audio is PCM - use Web Audio API
                if (!audioContextRef.current) {
                  audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                }
                const audioContext = audioContextRef.current;
                
                const binaryString = atob(base64Audio);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                
                const int16Data = new Int16Array(bytes.buffer);
                const floatData = new Float32Array(int16Data.length);
                for (let i = 0; i < int16Data.length; i++) {
                    floatData[i] = int16Data[i] / 32768.0;
                }
                
                const audioBuffer = audioContext.createBuffer(1, floatData.length, 24000);
                audioBuffer.getChannelData(0).set(floatData);
                
                const source = audioContext.createBufferSource();
                sourceNodeRef.current = source;
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
        return <span className="text-xs text-gray-400 italic">Audio unavailable</span>;
    }

    return (
        <button
            onClick={playAudio}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                isPlaying 
                    ? 'bg-green-500 text-white animate-pulse' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
        >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            {isPlaying ? 'Playing...' : 'Play Audio'}
        </button>
    );
};

const AdminMessages: React.FC<AdminMessagesProps> = ({ onBack }) => {
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'active' | 'trash'>('active');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());

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

    const isAudioContent = (content: string): boolean => {
        return content.length > 500 && !content.includes(' ') && /^[A-Za-z0-9+/=]+$/.test(content.substring(0, 100));
    };

    // Move session to trash
    const moveToTrash = async (sessionId: string) => {
        try {
            const { error } = await supabase
                .from('voice_support_interactions')
                .update({ is_trashed: true })
                .eq('session_id', sessionId);

            if (error) throw error;
            
            setInteractions(prev => prev.map(i => 
                i.session_id === sessionId ? { ...i, is_trashed: true } : i
            ));
            setToast({ message: 'Moved to trash', type: 'success' });
        } catch (err: any) {
            setToast({ message: 'Failed to move to trash', type: 'error' });
        }
    };

    // Restore session from trash
    const restoreFromTrash = async (sessionId: string) => {
        try {
            const { error } = await supabase
                .from('voice_support_interactions')
                .update({ is_trashed: false })
                .eq('session_id', sessionId);

            if (error) throw error;
            
            setInteractions(prev => prev.map(i => 
                i.session_id === sessionId ? { ...i, is_trashed: false } : i
            ));
            setToast({ message: 'Restored from trash', type: 'success' });
        } catch (err: any) {
            setToast({ message: 'Failed to restore', type: 'error' });
        }
    };

    // Permanently delete session
    const permanentlyDelete = async (sessionId: string) => {
        try {
            const { error } = await supabase
                .from('voice_support_interactions')
                .delete()
                .eq('session_id', sessionId);

            if (error) throw error;
            
            setInteractions(prev => prev.filter(i => i.session_id !== sessionId));
            setConfirmDelete(null);
            setToast({ message: 'Permanently deleted', type: 'success' });
        } catch (err: any) {
            setToast({ message: 'Failed to delete', type: 'error' });
        }
    };

    // Empty all trash
    const emptyTrash = async () => {
        const trashedIds = [...new Set(interactions.filter(i => i.is_trashed).map(i => i.session_id))];
        
        try {
            for (const sessionId of trashedIds) {
                await supabase
                    .from('voice_support_interactions')
                    .delete()
                    .eq('session_id', sessionId);
            }
            
            setInteractions(prev => prev.filter(i => !i.is_trashed));
            setConfirmDelete(null);
            setToast({ message: `Deleted ${trashedIds.length} conversations`, type: 'success' });
        } catch (err: any) {
            setToast({ message: 'Failed to empty trash', type: 'error' });
        }
    };

    // Filter interactions based on view mode
    const filteredInteractions = interactions.filter(i => 
        viewMode === 'trash' ? i.is_trashed : !i.is_trashed
    );

    // Group interactions by session_id
    const groupedInteractions = filteredInteractions.reduce((acc, interaction) => {
        if (!acc[interaction.session_id]) {
            acc[interaction.session_id] = [];
        }
        acc[interaction.session_id].push(interaction);
        return acc;
    }, {} as Record<string, Interaction[]>);

    const sortedSessions = Object.keys(groupedInteractions).sort((a, b) => {
        const lastA = new Date(groupedInteractions[a][0].created_at).getTime();
        const lastB = new Date(groupedInteractions[b][0].created_at).getTime();
        return lastB - lastA;
    });

    const trashCount = interactions.filter(i => i.is_trashed).length;
    const activeCount = interactions.filter(i => !i.is_trashed).length;

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <MessageSquare className="text-blue-600" /> 
                            {viewMode === 'trash' ? 'Trash' : 'AI Assistant Transcripts'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchMessages}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-2 mb-6">
                    <button
                        onClick={() => setViewMode('active')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                            viewMode === 'active' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        <MessageSquare size={16} />
                        Active ({[...new Set(interactions.filter(i => !i.is_trashed).map(i => i.session_id))].length})
                    </button>
                    <button
                        onClick={() => setViewMode('trash')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                            viewMode === 'trash' 
                                ? 'bg-red-600 text-white' 
                                : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        <Trash2 size={16} />
                        Trash ({[...new Set(interactions.filter(i => i.is_trashed).map(i => i.session_id))].length})
                    </button>

                    {viewMode === 'trash' && sortedSessions.length > 0 && (
                        <button
                            onClick={() => setConfirmDelete('all')}
                            className="ml-auto flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-all"
                        >
                            <Trash2 size={16} />
                            Empty Trash
                        </button>
                    )}
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        Error: {error}
                    </div>
                )}

                {loading && interactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <RefreshCw size={48} className="animate-spin mb-4" />
                        <p className="text-lg">Loading messages...</p>
                    </div>
                ) : sortedSessions.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                        {viewMode === 'trash' ? (
                            <>
                                <Trash2 size={64} className="mx-auto text-gray-300 mb-4" />
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">Trash is empty</h2>
                                <p className="text-gray-500">Deleted conversations will appear here.</p>
                            </>
                        ) : (
                            <>
                                <MessageSquare size={64} className="mx-auto text-gray-300 mb-4" />
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">No messages yet</h2>
                                <p className="text-gray-500">Customer conversations will appear here.</p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {sortedSessions.map(sessionId => {
                            const sessionInteractions = [...groupedInteractions[sessionId]].sort(
                                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                            );
                            const lastMessage = sessionInteractions[sessionInteractions.length - 1];
                            const voiceCount = sessionInteractions.filter(m => m.mode === 'voice' || isAudioContent(m.content)).length;
                            const textCount = sessionInteractions.length - voiceCount;

                            return (
                                <div key={sessionId} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    Session: {sessionId.substring(0, 8)}...
                                                </p>
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Clock size={12} /> {new Date(lastMessage.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {voiceCount > 0 && (
                                                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full flex items-center gap-1">
                                                    <Volume2 size={12} /> {voiceCount}
                                                </span>
                                            )}
                                            {textCount > 0 && (
                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                                                    {textCount} text
                                                </span>
                                            )}
                                            
                                            {viewMode === 'active' ? (
                                                <button
                                                    onClick={() => moveToTrash(sessionId)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Move to trash"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => restoreFromTrash(sessionId)}
                                                        className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-all"
                                                        title="Restore"
                                                    >
                                                        <RotateCcw size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmDelete(sessionId)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Delete permanently"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto bg-gray-50/30">
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
                                                            <span className="font-bold text-[10px] uppercase opacity-70">
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

            {/* Confirm Delete Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-red-100 rounded-full">
                                <AlertTriangle size={24} className="text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Confirm Delete</h3>
                                <p className="text-sm text-gray-500">This action cannot be undone.</p>
                            </div>
                        </div>
                        <p className="text-gray-600 mb-6">
                            {confirmDelete === 'all' 
                                ? 'Are you sure you want to permanently delete all conversations in trash?'
                                : 'Are you sure you want to permanently delete this conversation?'
                            }
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmDelete(null)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => confirmDelete === 'all' ? emptyTrash() : permanentlyDelete(confirmDelete)}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                            >
                                Delete Forever
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <Toast 
                    message={toast.message} 
                    type={toast.type} 
                    onClose={() => setToast(null)} 
                />
            )}
        </div>
    );
};

export default AdminMessages;
