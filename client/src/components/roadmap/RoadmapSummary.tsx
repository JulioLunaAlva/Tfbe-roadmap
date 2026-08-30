import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useYear } from '../../context/YearContext';
import API_URL from '../../config/api';
import { ChevronDown, ChevronUp, Layers } from 'lucide-react';

export const RoadmapSummary = () => {
    const { token } = useAuth();
    const { year } = useYear();
    const [initiatives, setInitiatives] = useState<any[]>([]);
    const [isExpanded, setIsExpanded] = useState<boolean>(() => {
        const saved = localStorage.getItem('roadmap_summary_expanded');
        return saved !== null ? saved === 'true' : true;
    });

    useEffect(() => {
        if (!token) return;
        fetch(`${API_URL}/api/initiatives?year=${year}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => Array.isArray(data) ? setInitiatives(data) : setInitiatives([]))
            .catch(console.error);
    }, [token, year]);

    const toggleExpanded = () => {
        setIsExpanded(prev => {
            const next = !prev;
            localStorage.setItem('roadmap_summary_expanded', String(next));
            return next;
        });
    };

    // Calculate area counts
    const byArea = initiatives.reduce((acc, curr) => {
        const a = curr.area || 'Sin Área';
        acc[a] = (acc[a] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const areaEntries = Object.entries(byArea).sort((a, b) => a[0].localeCompare(b[0]));

    return (
        <div className="bg-white dark:bg-[#1E2630] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700/50 text-sm mb-4 transition-all overflow-hidden">
            <button
                type="button"
                onClick={toggleExpanded}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors text-left"
            >
                <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-red-50 dark:bg-red-900/20 text-[#E10600]">
                        <Layers size={14} />
                    </div>
                    <span className="font-bold text-gray-700 dark:text-gray-300 uppercase text-[11px] tracking-wider">
                        Iniciativas por Área
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400">
                        {areaEntries.length} áreas
                    </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    <span className="text-[11px] font-medium hidden sm:inline">{isExpanded ? 'Contraer' : 'Expandir'}</span>
                    {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </div>
            </button>

            {isExpanded && (
                <div className="px-4 pb-3 pt-1 border-t border-gray-100 dark:border-gray-800 animate-in fade-in duration-200">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 pt-2">
                        {areaEntries.map(([area, count]) => (
                            <div 
                                key={area} 
                                className="flex justify-between items-center px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-[#252E3B] border border-gray-100 dark:border-gray-700/40 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                            >
                                <span className="text-gray-600 dark:text-gray-300 text-[11px] font-medium truncate mr-2" title={area}>
                                    {area}
                                </span>
                                <span className="font-bold text-gray-900 dark:text-white text-[11px] px-1.5 py-0.2 rounded bg-white dark:bg-[#1A222C] border border-gray-200 dark:border-gray-700/60 shadow-2xs">
                                    {String(count)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
