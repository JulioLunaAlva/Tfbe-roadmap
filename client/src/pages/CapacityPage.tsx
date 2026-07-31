import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useYear } from '../context/YearContext';
import API_URL from '../config/api';
import { Users, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface Initiative {
    id: string;
    name: string;
    developer_owner: string[] | string | null;
    start_date: string;
    end_date: string;
}

export const CapacityPage = () => {
    const { token } = useAuth();
    const { year: selectedYear } = useYear();
    const [initiatives, setInitiatives] = useState<Initiative[]>([]);
    const [loading, setLoading] = useState(true);

    const [currentMonth, setCurrentMonth] = useState(new Date(selectedYear, new Date().getMonth(), 1));

    useEffect(() => {
        const fetchInitiatives = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_URL}/api/initiatives?year=${selectedYear}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (Array.isArray(data)) {
                    setInitiatives(data);
                }
            } catch (error) {
                console.error("Error fetching initiatives:", error);
            }
            setLoading(false);
        };
        if (token) fetchInitiatives();
    }, [token, selectedYear]);

    // Group initiatives by developer
    const developerMap = useMemo(() => {
        const map: Record<string, Initiative[]> = {};
        
        initiatives.forEach(init => {
            if (!init.start_date || !init.end_date) return; // Need dates for capacity
            
            let devs: string[] = [];
            if (Array.isArray(init.developer_owner)) {
                devs = init.developer_owner;
            } else if (typeof init.developer_owner === 'string') {
                try {
                    const parsed = JSON.parse(init.developer_owner);
                    if (Array.isArray(parsed)) devs = parsed;
                    else devs = [init.developer_owner];
                } catch {
                    devs = [init.developer_owner];
                }
            }
            
            if (devs.length === 0) return;

            devs.forEach(dev => {
                if (dev && dev.trim()) {
                    const cleanDev = dev.trim();
                    if (!map[cleanDev]) map[cleanDev] = [];
                    map[cleanDev].push(init);
                }
            });
        });
        
        return map;
    }, [initiatives]);

    // Days in current month view
    const daysInMonth = useMemo(() => {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    const changeMonth = (offset: number) => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };

    return (
        <div className="h-full flex flex-col bg-[var(--bg-primary)] p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl shadow-sm">
                        <Users size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Capacity Planning</h1>
                        <p className="text-sm text-[var(--text-tertiary)]">Visualización de carga de trabajo por desarrollador</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-white dark:bg-[#1A2332] p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
                    <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">&lt;</button>
                    <div className="px-4 font-semibold text-gray-700 dark:text-gray-200 min-w-[120px] text-center capitalize">
                        {format(currentMonth, 'MMMM yyyy', { locale: es })}
                    </div>
                    <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">&gt;</button>
                </div>
            </div>

            <div className="flex-1 bg-white dark:bg-[#0D1520] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="animate-spin text-teal-500" size={32} />
                    </div>
                ) : Object.keys(developerMap).length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                        <CalendarIcon size={48} className="mb-4 opacity-20" />
                        <p>No hay iniciativas con fechas asignadas a desarrolladores en {selectedYear}</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto custom-scrollbar relative">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-gray-50 dark:bg-[#1A2332] z-10 shadow-sm">
                                <tr>
                                    <th className="p-4 border-b border-r border-gray-200 dark:border-gray-800 font-semibold text-gray-700 dark:text-gray-300 min-w-[200px] w-[200px]">
                                        Desarrollador
                                    </th>
                                    {daysInMonth.map(day => (
                                        <th key={day.toISOString()} className="p-2 border-b border-r border-gray-200 dark:border-gray-800 text-center text-xs text-gray-500 min-w-[32px] w-[32px]">
                                            <div className="flex flex-col items-center">
                                                <span className="font-semibold">{format(day, 'd')}</span>
                                                <span className="text-[10px] opacity-70">{format(day, 'EEE', { locale: es }).slice(0, 1)}</span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(developerMap).map(([dev, inits]) => (
                                    <tr key={dev} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="p-4 border-b border-r border-gray-200 dark:border-gray-800 font-medium text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-[#0D1520] sticky left-0 z-0">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-teal-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                                    {dev.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="truncate" title={dev}>{dev}</span>
                                            </div>
                                            <div className="text-[10px] text-gray-500 mt-1 pl-8">
                                                {inits.length} iniciativa(s)
                                            </div>
                                        </td>
                                        {daysInMonth.map(day => {
                                            // Check how many initiatives overlap this day
                                            const overlapping = inits.filter(init => {
                                                const start = parseISO(init.start_date);
                                                const end = parseISO(init.end_date);
                                                return isWithinInterval(day, { start, end });
                                            });

                                            const loadCount = overlapping.length;
                                            
                                            // Heatmap colors based on load
                                            let bgColor = '';
                                            if (loadCount === 1) bgColor = 'bg-teal-100 dark:bg-teal-900/40 border-teal-200 dark:border-teal-800';
                                            else if (loadCount === 2) bgColor = 'bg-amber-100 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800';
                                            else if (loadCount >= 3) bgColor = 'bg-red-100 dark:bg-red-900/40 border-red-200 dark:border-red-800';

                                            return (
                                                <td key={day.toISOString()} className="p-1 border-b border-r border-gray-200 dark:border-gray-800 text-center relative group">
                                                    {loadCount > 0 && (
                                                        <div className={`w-full h-8 rounded border ${bgColor} flex items-center justify-center text-[10px] font-bold cursor-pointer transition-transform hover:scale-110`}>
                                                            {loadCount}
                                                        </div>
                                                    )}
                                                    {loadCount > 0 && (
                                                        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg">
                                                            <div className="font-semibold mb-1 border-b border-gray-700 pb-1">Carga del día: {loadCount}</div>
                                                            <ul className="space-y-1">
                                                                {overlapping.map(o => (
                                                                    <li key={o.id} className="truncate">- {o.name}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            {/* Legend */}
            <div className="mt-4 flex gap-6 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-teal-100 border border-teal-200"></div> Carga Normal (1)</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-amber-100 border border-amber-200"></div> Carga Alta (2)</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-red-100 border border-red-200"></div> Sobrecarga (3+)</div>
            </div>
        </div>
    );
};
