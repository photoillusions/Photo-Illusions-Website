import React, { useEffect, useState } from 'react';
import { supabase } from '../src/supabaseClient';
import { MessageSquare, Clock, ArrowLeft, RefreshCw, Trash2 } from 'lucide-react';

interface Interaction {
    id: number;
    session_id: string;
    role: 'user' | 'model';
    content: string;
    created_at: string;
}

interface AdminMessagesProps {
    onBack: () => void;
}

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

                            return (
                                <div key={sessionId} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                                                {firstMessage.role === 'user' ? firstMessage.content[0].toUpperCase() : 'AI'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">Session: {sessionId.substring(0, 8)}...</p>
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Clock size={12} /> {new Date(lastMessage.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider">
                                            {sessionInteractions.length} Messages
                                        </span>
                                    </div>
                                    <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto bg-gray-50/30">
                                        {sessionInteractions.map((msg) => (
                                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.role === 'user'
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-white text-gray-800 border border-gray-100'
                                                    }`}>
                                                    <div className="flex items-center justify-between gap-4 mb-1">
                                                        <span className="font-bold text-[10px] uppercase opacity-70">
                                                            {msg.role === 'user' ? 'User' : 'Assistant'}
                                                        </span>
                                                    </div>
                                                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                </div>
                                            </div>
                                        ))}
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
