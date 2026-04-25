import { useState, useEffect, useRef } from 'react';
import { Bell, Clock, User, FileText, Zap, Trash2, Edit3, PlusCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config/api';

interface ActivityItem {
    id: string;
    user_id: string;
    user_email: string;
    action: string;
    entity_id: string;
    details: any;
    created_at: string;
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

const getActionIcon = (action: string) => {
    const a = action.toLowerCase();
    if (a.includes('create') || a.includes('created') || a.includes('new')) return <PlusCircle size={14} className="text-green-500" />;
    if (a.includes('delete') || a.includes('removed')) return <Trash2 size={14} className="text-red-500" />;
    if (a.includes('update') || a.includes('edit') || a.includes('modified')) return <Edit3 size={14} className="text-blue-500" />;
    return <Zap size={14} className="text-amber-500" />;
};

const getActionLabel = (action: string) => {
    const a = action.toLowerCase();
    if (a.includes('create')) return 'creó';
    if (a.includes('delete')) return 'eliminó';
    if (a.includes('update') || a.includes('edit')) return 'actualizó';
    if (a.includes('login')) return 'inició sesión';
    if (a.includes('import')) return 'importó datos';
    return action;
};

export const ActivityFeed = () => {
    const { token } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [recentCount, setRecentCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    // Fetch recent count periodically
    useEffect(() => {
        if (!token) return;
        const fetchCount = async () => {
            try {
                const res = await fetch(`${API_URL}/api/activity/recent-count`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setRecentCount(data.count || 0);
                }
            } catch (_err) {
                // Silently fail
            }
        };
        fetchCount();
        const interval = setInterval(fetchCount, 120000); // Every 2 min
        return () => clearInterval(interval);
    }, [token]);

    const fetchActivities = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/activity?limit=25`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setActivities(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Error fetching activities:', err);
        }
        setLoading(false);
    };

    const handleToggle = () => {
        if (!isOpen) {
            fetchActivities();
            setRecentCount(0); // Clear badge on open
        }
        setIsOpen(!isOpen);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={handleToggle}
                className="relative p-2 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-color)] transition-colors border border-[var(--border-color)]"
                title="Actividad reciente"
            >
                <Bell size={14} />
                {recentCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-red-500 to-rose-600 text-white text-[8px] font-bold rounded-full flex items-center justify-center shadow-sm animate-pulse">
                        {recentCount > 9 ? '9+' : recentCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-white dark:bg-[#1A2332] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700/50 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <div className="p-1 bg-gradient-to-br from-amber-400 to-orange-500 rounded-md shadow-sm">
                                <Zap size={12} className="text-white" />
                            </div>
                            <h3 className="text-sm font-bold text-gray-800 dark:text-white">Actividad Reciente</h3>
                        </div>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                            Últimas 24h
                        </span>
                    </div>

                    {/* Activity List */}
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="flex items-center justify-center h-24">
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-500 border-t-transparent" />
                            </div>
                        ) : activities.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-24 text-gray-400 dark:text-gray-500">
                                <Bell size={20} className="mb-1 opacity-50" />
                                <p className="text-xs">Sin actividad reciente</p>
                            </div>
                        ) : (
                            activities.map((activity) => {
                                const email = activity.user_email || 'sistema';
                                const emailName = email.split('@')[0];
                                const details = activity.details || {};

                                return (
                                    <div
                                        key={activity.id}
                                        className="px-4 py-2.5 border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-[#111827]/50 transition-colors"
                                    >
                                        <div className="flex items-start space-x-2.5">
                                            <div className="mt-0.5 flex-shrink-0">
                                                {getActionIcon(activity.action)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                                                    <span className="font-bold text-gray-800 dark:text-white">{emailName}</span>
                                                    {' '}{getActionLabel(activity.action)}
                                                    {details.entity_type && (
                                                        <span className="text-gray-500"> {details.entity_type}</span>
                                                    )}
                                                    {details.name && (
                                                        <span className="font-medium text-indigo-600 dark:text-indigo-400"> "{details.name}"</span>
                                                    )}
                                                </p>
                                                <div className="flex items-center mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">
                                                    <Clock size={9} className="mr-1" />
                                                    {formatRelativeTime(activity.created_at)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
