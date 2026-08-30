import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useYear } from '../context/YearContext';
import { useArea } from '../context/AreaContext';
import API_URL from '../config/api';
import { Users, AlertTriangle, CheckCircle2, TrendingUp, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { clsx } from 'clsx';

interface Initiative {
    id: string;
    name: string;
    developer_owner: string[] | string | null;
    status: string;
    progress: number;
    end_date: string | null;
}

export const CapacityPage = () => {
    const { token } = useAuth();
    const { year: selectedYear } = useYear();
    const { areaQueryParam } = useArea();
    const [initiatives, setInitiatives] = useState<Initiative[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInitiatives = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_URL}/api/initiatives?year=${selectedYear}${areaQueryParam}`, {
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
    }, [token, selectedYear, areaQueryParam]);

    // Process data to group by developer
    const developerData = useMemo(() => {
        const map: Record<string, Initiative[]> = {};
        
        // Filter active initiatives only
        const activeStatuses = ['en plan', 'en curso', 'retrasado'];
        const activeInits = initiatives.filter(i => activeStatuses.includes((i.status || '').toLowerCase()));

        activeInits.forEach(init => {
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

        // Convert map to array and sort by load
        return Object.entries(map).map(([name, inits]) => {
            let loadState = 'normal'; // 1-2
            if (inits.length > 2 && inits.length <= 4) loadState = 'high';
            if (inits.length > 4) loadState = 'overload';

            return {
                name,
                initiatives: inits,
                count: inits.length,
                loadState
            };
        }).sort((a, b) => b.count - a.count);
    }, [initiatives]);

    // Summary Metrics
    const metrics = useMemo(() => {
        const totalDevs = developerData.length;
        const totalInits = developerData.reduce((acc, curr) => acc + curr.count, 0); // Note: total assignments
        const overloaded = developerData.filter(d => d.loadState === 'overload').length;
        
        return { totalDevs, totalInits, overloaded };
    }, [developerData]);

    const getLoadBadge = (state: string) => {
        switch (state) {
            case 'overload': return <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border border-red-200 dark:border-red-800"><AlertTriangle size={12}/> Sobrecarga</span>;
            case 'high': return <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800"><TrendingUp size={12}/> Alta</span>;
            default: return <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400 border border-teal-200 dark:border-teal-800"><CheckCircle2 size={12}/> Normal</span>;
        }
    };

    return (
        <div className="h-full flex flex-col bg-[var(--bg-primary)] p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-sm">
                        <Users size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Capacity Planning</h1>
                        <p className="text-sm text-[var(--text-tertiary)]">Carga de trabajo activa por Desarrollador</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="animate-spin text-indigo-500" size={32} />
                </div>
            ) : developerData.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-white dark:bg-[#1A2332] rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <Users size={48} className="mb-4 opacity-20" />
                    <p className="font-medium text-lg text-gray-800 dark:text-gray-200">Sin Asignaciones</p>
                    <p className="text-sm">No hay iniciativas activas asignadas a desarrolladores en {selectedYear}</p>
                </div>
            ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Metrics Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white dark:bg-[#1A2332] p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg"><Users size={24}/></div>
                            <div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Desarrolladores Activos</div>
                                <div className="text-2xl font-bold text-gray-800 dark:text-white">{metrics.totalDevs}</div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-[#1A2332] p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg"><TrendingUp size={24}/></div>
                            <div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Iniciativas Asignadas</div>
                                <div className="text-2xl font-bold text-gray-800 dark:text-white">{metrics.totalInits}</div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-[#1A2332] p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg"><AlertTriangle size={24}/></div>
                            <div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Con Sobrecarga (5+)</div>
                                <div className="text-2xl font-bold text-gray-800 dark:text-white">{metrics.overloaded}</div>
                            </div>
                        </div>
                    </div>

                    {/* Developers Grid */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-6">
                            {developerData.map(dev => (
                                <div key={dev.name} className="bg-white dark:bg-[#1A2332] rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col transition-shadow hover:shadow-md">
                                    <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-start bg-gray-50/50 dark:bg-gray-800/20">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
                                                {dev.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-800 dark:text-white text-base leading-tight">{dev.name}</h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{dev.count} iniciativa(s) activa(s)</p>
                                            </div>
                                        </div>
                                        {getLoadBadge(dev.loadState)}
                                    </div>
                                    
                                    <div className="p-4 flex-1 flex flex-col gap-3">
                                        {dev.initiatives.map(init => (
                                            <div key={init.id} className="bg-gray-50 dark:bg-[#0D1520] p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                                                <div className="flex justify-between items-start mb-2 gap-2">
                                                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 leading-tight">
                                                        {init.name}
                                                    </h4>
                                                    <span className={clsx(
                                                        "text-[10px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap",
                                                        init.status.toLowerCase().includes('retrasado') ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                                        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                                    )}>
                                                        {init.status}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                                                    <div className="flex items-center gap-1">
                                                        <CalendarIcon size={12} />
                                                        {init.end_date ? format(parseISO(init.end_date), "dd MMM yyyy", { locale: es }) : "Sin fecha"}
                                                    </div>
                                                    <div className="font-medium">{init.progress}%</div>
                                                </div>
                                                
                                                {/* Progress Bar */}
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                                    <div 
                                                        className={clsx(
                                                            "h-1.5 rounded-full transition-all",
                                                            init.status.toLowerCase().includes('retrasado') ? "bg-red-500" : "bg-indigo-500"
                                                        )}
                                                        style={{ width: `${init.progress || 0}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
