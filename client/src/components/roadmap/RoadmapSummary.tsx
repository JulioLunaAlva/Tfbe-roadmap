import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useYear } from '../../context/YearContext';
import API_URL from '../../config/api';

export const RoadmapSummary = () => {
    const { token } = useAuth();
    const { year } = useYear();
    const [initiatives, setInitiatives] = useState<any[]>([]);

    useEffect(() => {
        if (!token) return;
        fetch(`${API_URL}/api/initiatives?year=${year}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => Array.isArray(data) ? setInitiatives(data) : setInitiatives([]))
            .catch(console.error);
    }, [token, year]);

    // Calculate area counts
    const byArea = initiatives.reduce((acc, curr) => {
        const a = curr.area || 'Sin Área';
        acc[a] = (acc[a] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="bg-white dark:bg-[#1E2630] p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700/50 text-sm mb-6 transition-all">
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between mb-2 border-b border-gray-100 dark:border-gray-800 pb-1">
                    <h4 className="font-bold text-gray-700 dark:text-gray-300 uppercase text-[10px] tracking-wider">
                        Iniciativas por Área
                    </h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-2">
                    {Object.entries(byArea).sort((a, b) => a[0].localeCompare(b[0])).map(([area, count]) => (
                        <div key={area} className="flex justify-between items-center py-1 border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                            <span className="text-gray-500 dark:text-gray-400 text-[11px] truncate mr-2" title={area}>{area}</span>
                            <span className="font-bold text-gray-800 dark:text-gray-200 text-[11px]">
                                {String(count)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
