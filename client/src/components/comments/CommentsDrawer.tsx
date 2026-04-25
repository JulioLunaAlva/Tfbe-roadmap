import { useState, useEffect, useRef } from 'react';
import { X, Send, Trash2, MessageCircle, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config/api';

interface Comment {
    id: string;
    initiative_id: string;
    user_id: string;
    user_email: string;
    content: string;
    created_at: string;
}

interface CommentsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    initiativeId: string;
    initiativeName: string;
}

const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return 'ahora';
    if (diffMin < 60) return `hace ${diffMin}m`;
    if (diffHr < 24) return `hace ${diffHr}h`;
    if (diffDay < 7) return `hace ${diffDay}d`;
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
};

const getAvatarColor = (email: string) => {
    const colors = [
        'from-violet-500 to-purple-600',
        'from-blue-500 to-cyan-600',
        'from-emerald-500 to-teal-600',
        'from-amber-500 to-orange-600',
        'from-rose-500 to-pink-600',
        'from-indigo-500 to-blue-600',
        'from-lime-500 to-green-600',
        'from-fuchsia-500 to-purple-600',
    ];
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
        hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

export const CommentsDrawer = ({ isOpen, onClose, initiativeId, initiativeName }: CommentsDrawerProps) => {
    const { token, user } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen && initiativeId) {
            fetchComments();
        }
    }, [isOpen, initiativeId]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    const fetchComments = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/comments/${initiativeId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setComments(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching comments:', err);
        }
        setLoading(false);
    };

    const handleSend = async () => {
        if (!newComment.trim() || sending) return;
        setSending(true);

        try {
            const res = await fetch(`${API_URL}/api/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    initiative_id: initiativeId,
                    content: newComment.trim(),
                }),
            });

            if (res.ok) {
                const comment = await res.json();
                setComments(prev => [comment, ...prev]);
                setNewComment('');
                // Scroll to top
                setTimeout(() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 100);
            }
        } catch (err) {
            console.error('Error sending comment:', err);
        }
        setSending(false);
    };

    const handleDelete = async (commentId: string) => {
        if (!confirm('¿Eliminar este comentario?')) return;
        try {
            await fetch(`${API_URL}/api/comments/${commentId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            setComments(prev => prev.filter(c => c.id !== commentId));
        } catch (err) {
            console.error('Error deleting comment:', err);
        }
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Drawer */}
            <div
                className={`fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-[#1A2332] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700/50 flex-shrink-0">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-sm">
                            <MessageCircle size={16} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-bold text-gray-800 dark:text-white truncate">
                                Comentarios
                            </h3>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate" title={initiativeName}>
                                {initiativeName}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Input area at top */}
                {(user?.role === 'admin' || user?.role === 'editor') && (
                    <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700/30 flex-shrink-0">
                        <div className="flex space-x-2">
                            <textarea
                                ref={inputRef}
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder="Escribe un comentario..."
                                rows={2}
                                className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-[#111827] text-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none placeholder:text-gray-400"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!newComment.trim() || sending}
                                className="self-end px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Comments list */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-3 space-y-3 custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent" />
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-400 dark:text-gray-500">
                            <MessageCircle size={32} className="mb-2 opacity-50" />
                            <p className="text-sm">Sin comentarios aún</p>
                            <p className="text-xs mt-1">Sé el primero en comentar</p>
                        </div>
                    ) : (
                        comments.map((comment) => {
                            const emailName = comment.user_email?.split('@')[0] || 'usuario';
                            const initial = emailName.charAt(0).toUpperCase();
                            const isOwn = comment.user_email === user?.email;
                            const avatarGradient = getAvatarColor(comment.user_email || '');

                            return (
                                <div
                                    key={comment.id}
                                    className="group flex space-x-2.5 animate-fadeIn"
                                >
                                    {/* Avatar */}
                                    <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm`}>
                                        {initial}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-0.5">
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">
                                                {emailName}
                                            </span>
                                            <span className="flex items-center text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">
                                                <Clock size={9} className="mr-0.5" />
                                                {formatRelativeTime(comment.created_at)}
                                            </span>
                                            {(isOwn || user?.role === 'admin') && (
                                                <button
                                                    onClick={() => handleDelete(comment.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500 transition-all"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={11} />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words leading-relaxed">
                                            {comment.content}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </>
    );
};
