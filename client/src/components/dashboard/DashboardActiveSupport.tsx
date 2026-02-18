import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config/api';
import { LifeBuoy } from 'lucide-react';

interface SupportItem {
    id: string;
    area: string;
    status: string;
}

export const DashboardActiveSupport: React.FC = () => {
    const { token } = useAuth();
    const [items, setItems] = useState<SupportItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const res = await fetch(`${API_URL}/api/support`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (Array.isArray(data)) {
                    setItems(data.filter((i: SupportItem) => i.status === 'Active'));
                }
            } catch (error) {
                console.error('Error fetching support items:', error);
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchItems();
    }, [token]);

    const stats = useMemo(() => {
        const groups: Record<string, number> = {};
        items.forEach(item => {
            groups[item.area] = (groups[item.area] || 0) + 1;
        });
        return Object.entries(groups)
            .sort(([, a], [, b]) => b - a); // Sort by count desc
    }, [items]);

    return (
        <div className="bg-white dark:bg-[#1E2630] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 h-full flex flex-col min-h-[300px]">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                    <LifeBuoy size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 leading-tight">Soporte Activo</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Por Área</p>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            ) : items.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                    <p className="text-sm">No hay iniciativas activas</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                    {/* Total Active Big Number */}
                    <div className="text-center mb-6 p-4 bg-gray-50 dark:bg-[#111827/50] rounded-xl border border-gray-100 dark:border-gray-800">
                        <span className="text-4xl font-extrabold text-blue-600 dark:text-blue-400">{items.length}</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase mt-1">Total Activas</p>
                    </div>

                    {/* Breakdown by Area */}
                    <div className="space-y-3">
                        {stats.map(([area, count]) => (
                            <div key={area} className="flex items-center justify-between group">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {area}
                                    </span>
                                </div>
                                <span className="text-xs font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                                    {count}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
