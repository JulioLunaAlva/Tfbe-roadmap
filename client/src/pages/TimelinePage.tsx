import { useState, useEffect, useMemo, useRef } from 'react';
import { Calendar, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useYear } from '../context/YearContext';
import API_URL from '../config/api';

interface Initiative {
    id: string;
    name: string;
    area: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    progress?: number;
    is_top_priority?: boolean;
    is_key_initiative?: boolean;
    complexity?: string;
    tags?: string[];
}

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const QUARTER_COLORS = [
    'from-violet-500/10 to-purple-500/5',
    'from-blue-500/10 to-cyan-500/5',
    'from-emerald-500/10 to-teal-500/5',
    'from-amber-500/10 to-orange-500/5',
];

const STATUS_COLORS: Record<string, { bg: string, text: string, light: string }> = {
    'Entregado': { bg: 'bg-emerald-500', text: 'text-white', light: 'bg-emerald-100 dark:bg-emerald-900/30' },
    'En curso': { bg: 'bg-blue-500', text: 'text-white', light: 'bg-blue-100 dark:bg-blue-900/30' },
    'Avance conforme plan': { bg: 'bg-blue-500', text: 'text-white', light: 'bg-blue-100 dark:bg-blue-900/30' },
    'Retrasado': { bg: 'bg-red-500', text: 'text-white', light: 'bg-red-100 dark:bg-red-900/30' },
    'Atraso': { bg: 'bg-red-500', text: 'text-white', light: 'bg-red-100 dark:bg-red-900/30' },
    'En redefinición': { bg: 'bg-amber-500', text: 'text-white', light: 'bg-amber-100 dark:bg-amber-900/30' },
    'Cancelado': { bg: 'bg-rose-600', text: 'text-white', light: 'bg-rose-100 dark:bg-rose-900/30' },
    'default': { bg: 'bg-gray-400', text: 'text-white', light: 'bg-gray-100 dark:bg-gray-800' }
};

const getStatusColor = (status?: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.default;
};

const AREA_COLORS = [
    { border: 'border-l-violet-500', text: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500' },
    { border: 'border-l-blue-500', text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500' },
    { border: 'border-l-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500' },
    { border: 'border-l-amber-500', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500' },
    { border: 'border-l-rose-500', text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500' },
    { border: 'border-l-cyan-500', text: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-500' },
    { border: 'border-l-indigo-500', text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500' },
    { border: 'border-l-teal-500', text: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500' },
    { border: 'border-l-orange-500', text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500' },
    { border: 'border-l-fuchsia-500', text: 'text-fuchsia-600 dark:text-fuchsia-400', bg: 'bg-fuchsia-500' },
    { border: 'border-l-lime-500', text: 'text-lime-600 dark:text-lime-400', bg: 'bg-lime-500' },
    { border: 'border-l-pink-500', text: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-500' },
];

const getAreaColor = (area: string) => {
    let hash = 0;
    for (let i = 0; i < area.length; i++) hash = area.charCodeAt(i) + ((hash << 5) - hash);
    return AREA_COLORS[Math.abs(hash) % AREA_COLORS.length];
};

export const TimelinePage = () => {
    const { token } = useAuth();
    const { year } = useYear();
    const [initiatives, setInitiatives] = useState<Initiative[]>([]);
    const [loading, setLoading] = useState(true);
    const [zoomLevel, setZoomLevel] = useState(1); // 0.5 = compact, 1 = normal, 2 = wide
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [filterArea, setFilterArea] = useState<string>('');
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!token) return;
        setLoading(true);
        fetch(`${API_URL}/api/initiatives?year=${year}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => {
                setInitiatives(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [token, year]);

    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);
    const totalDays = Math.ceil((yearEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const dayWidth = 2.5 * zoomLevel;
    const totalWidth = totalDays * dayWidth;

    const today = new Date();
    const todayOffset = today.getFullYear() === year
        ? Math.ceil((today.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24))
        : -1;

    const areas = useMemo(() => {
        return Array.from(new Set(initiatives.map(i => i.area).filter(Boolean))).sort();
    }, [initiatives]);

    const filtered = useMemo(() => {
        let data = initiatives.filter(i => i.start_date || i.end_date);
        if (filterArea) data = data.filter(i => i.area === filterArea);
        // Sort by start_date
        data.sort((a, b) => {
            const aDt = a.start_date ? new Date(a.start_date).getTime() : Infinity;
            const bDt = b.start_date ? new Date(b.start_date).getTime() : Infinity;
            return aDt - bDt;
        });
        return data;
    }, [initiatives, filterArea]);

    // Group by area
    const grouped = useMemo(() => {
        const map = new Map<string, Initiative[]>();
        filtered.forEach(i => {
            const area = i.area || 'Sin Área';
            if (!map.has(area)) map.set(area, []);
            map.get(area)!.push(i);
        });
        return map;
    }, [filtered]);

    const scrollToToday = () => {
        if (scrollContainerRef.current && todayOffset > 0) {
            scrollContainerRef.current.scrollTo({
                left: todayOffset * dayWidth - scrollContainerRef.current.clientWidth / 2,
                behavior: 'smooth',
            });
        }
    };

    useEffect(() => {
        // Auto-scroll to today on load
        const timer = setTimeout(scrollToToday, 500);
        return () => clearTimeout(timer);
    }, [loading, zoomLevel]);

    const getBarPosition = (startDate?: string, endDate?: string) => {
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        if (!start && !end) return null;

        const effectiveStart = start || new Date(year, 0, 1);
        const effectiveEnd = end || new Date(year, 11, 31);

        const startOffset = Math.max(0, Math.ceil((effectiveStart.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)));
        const endOffset = Math.min(totalDays, Math.ceil((effectiveEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)));
        const width = Math.max(1, endOffset - startOffset);

        return {
            left: startOffset * dayWidth,
            width: width * dayWidth,
        };
    };

    const rowHeight = 36;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="w-full px-4 space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                        <Calendar size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Timeline de Iniciativas</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {filtered.length} iniciativas con fechas · {year}
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    {/* Area filter */}
                    <select
                        value={filterArea}
                        onChange={e => setFilterArea(e.target.value)}
                        className="text-xs bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md px-2 py-1.5 text-[var(--text-primary)] outline-none"
                    >
                        <option value="">Todas las áreas</option>
                        {areas.map(a => (
                            <option key={a} value={a}>{a}</option>
                        ))}
                    </select>

                    {/* Zoom controls */}
                    <div className="flex items-center bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md">
                        <button
                            onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                            className="p-1.5 hover:bg-[var(--border-color)] rounded-l-md transition-colors text-[var(--text-secondary)]"
                            title="Reducir zoom"
                        >
                            <ZoomOut size={14} />
                        </button>
                        <span className="text-[10px] font-bold text-[var(--text-tertiary)] px-2">{Math.round(zoomLevel * 100)}%</span>
                        <button
                            onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
                            className="p-1.5 hover:bg-[var(--border-color)] rounded-r-md transition-colors text-[var(--text-secondary)]"
                            title="Aumentar zoom"
                        >
                            <ZoomIn size={14} />
                        </button>
                    </div>

                    {/* Scroll to today */}
                    <button
                        onClick={scrollToToday}
                        className="flex items-center space-x-1 px-2 py-1.5 text-xs bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-md hover:from-indigo-600 hover:to-purple-700 transition-all shadow-sm"
                        title="Ir a hoy"
                    >
                        <Maximize2 size={12} />
                        <span>Hoy</span>
                    </button>
                </div>
            </div>

            {/* Timeline Container */}
            <div className="bg-white dark:bg-[#1E2630] rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-xl overflow-hidden">
                <div 
                    ref={scrollContainerRef}
                    className="overflow-auto max-h-[75vh] custom-scrollbar relative"
                >
                    {/* Header Row (Sticky Top) */}
                    <div className="flex sticky top-0 z-30 bg-white dark:bg-[#1E2630] border-b border-gray-200 dark:border-gray-700/50">
                        {/* Empty corner for initiative labels */}
                        <div className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-700/50 bg-gray-50/80 dark:bg-[#1A2332]/80 backdrop-blur-sm sticky left-0 z-40 h-12 flex items-center px-4">
                            <span className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Iniciativas</span>
                        </div>

                        {/* Months Row */}
                        <div className="relative flex-1 h-12" style={{ width: totalWidth }}>
                            {MONTHS.map((month, idx) => {
                                const monthStart = new Date(year, idx, 1);
                                const monthEnd = new Date(year, idx + 1, 0);
                                const startOffset = Math.ceil((monthStart.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
                                const daysInMonth = monthEnd.getDate();
                                const quarterIdx = Math.floor(idx / 3);

                                return (
                                    <div
                                        key={month}
                                        className={`border-r border-gray-200 dark:border-gray-700/30 flex items-center justify-center bg-gradient-to-b ${QUARTER_COLORS[quarterIdx]}`}
                                        style={{ 
                                            left: startOffset * dayWidth, 
                                            width: daysInMonth * dayWidth, 
                                            position: 'absolute',
                                            height: '100%'
                                        }}
                                    >
                                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{month}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Content Body */}
                    <div className="flex relative" style={{ width: 'max-content' }}>
                        {/* Names Column (Sticky Left) */}
                        <div className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-700/50 bg-white dark:bg-[#1A2332] sticky left-0 z-20 shadow-sm">
                            {Array.from(grouped.entries()).map(([area, inits]) => {
                                const areaColor = getAreaColor(area);
                                return (
                                    <div key={area}>
                                        {/* Area header */}
                                        <div className={`px-4 py-2 bg-gray-50 dark:bg-[#111827] border-b border-gray-100 dark:border-gray-800`}>
                                            <span className={`text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center`}>
                                                {area}
                                            </span>
                                        </div>
                                        {inits.map(init => (
                                            <div
                                                key={init.id}
                                                className={`flex items-center px-4 border-b border-gray-100 dark:border-gray-800/50 transition-colors cursor-default border-l-[3px] ${areaColor.border} ${hoveredId === init.id ? 'bg-indigo-50 dark:bg-indigo-900/10' : 'hover:bg-gray-50 dark:hover:bg-[#111827]/30'}`}
                                                style={{ height: rowHeight }}
                                                onMouseEnter={() => setHoveredId(init.id)}
                                                onMouseLeave={() => setHoveredId(null)}
                                            >
                                                <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 truncate" title={init.name}>
                                                    {init.name}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Chart Area */}
                        <div className="relative" style={{ width: totalWidth }}>
                            {/* Today marker */}
                            {todayOffset > 0 && todayOffset < totalDays && (
                                <div
                                    className="absolute top-0 bottom-0 w-px bg-red-500/50 z-10 pointer-events-none"
                                    style={{ left: todayOffset * dayWidth }}
                                >
                                    <div className="absolute top-0 -left-3 bg-red-500 text-white text-[7px] font-bold px-1 py-0.5 rounded-b-sm shadow-sm">
                                        HOY
                                    </div>
                                </div>
                            )}

                            {/* Quarter lines */}
                            {[1, 2, 3].map(q => {
                                const qStart = new Date(year, q * 3, 1);
                                const offset = Math.ceil((qStart.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
                                return (
                                    <div
                                        key={`q${q}`}
                                        className="absolute top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700/50 z-0 pointer-events-none"
                                        style={{ left: offset * dayWidth }}
                                    />
                                );
                            })}

                            {/* Row backgrounds and bars */}
                            {Array.from(grouped.entries()).map(([area, inits]) => (
                                <div key={area}>
                                    {/* Area spacer row */}
                                    <div className="border-b border-gray-100 dark:border-gray-800" style={{ height: 28 }} />
                                    
                                    {inits.map(init => {
                                        const bar = getBarPosition(init.start_date, init.end_date);
                                        const progress = init.progress || 0;
                                        const statusColor = getStatusColor(init.status).bg;

                                        return (
                                            <div
                                                key={init.id}
                                                className={`relative border-b border-gray-100 dark:border-gray-800/50 transition-colors ${hoveredId === init.id ? 'bg-indigo-50/30 dark:bg-indigo-900/5' : ''}`}
                                                style={{ height: rowHeight }}
                                                onMouseEnter={() => setHoveredId(init.id)}
                                                onMouseLeave={() => setHoveredId(null)}
                                            >
                                                {bar && (
                                                    <div
                                                        className={`absolute top-1.5 rounded-md shadow-sm overflow-hidden transition-all duration-200 group cursor-pointer ${hoveredId === init.id ? 'ring-2 ring-indigo-400 ring-offset-1 dark:ring-offset-[#1E2630]' : ''}`}
                                                        style={{
                                                            left: bar.left,
                                                            width: bar.width,
                                                            height: rowHeight - 12,
                                                        }}
                                                        title={`${init.name}\nInicio: ${init.start_date || 'N/A'}\nFin: ${init.end_date || 'N/A'}\nAvance: ${progress}%\nEstatus: ${init.status || 'N/A'}`}
                                                    >
                                                        {/* Background */}
                                                        <div className={`absolute inset-0 ${statusColor} opacity-20`} />
                                                        
                                                        {/* Progress fill */}
                                                        <div
                                                            className={`absolute inset-y-0 left-0 ${statusColor} opacity-60 transition-all`}
                                                            style={{ width: `${progress}%` }}
                                                        />

                                                        {/* Label */}
                                                        <div className="relative z-10 px-1.5 flex items-center h-full">
                                                            <span className="text-[9px] font-bold text-white drop-shadow-sm truncate">
                                                                {bar.width > 60 ? init.name : ''}
                                                            </span>
                                                            {bar.width > 30 && (
                                                                <span className="text-[8px] font-bold text-white/80 ml-auto flex-shrink-0">
                                                                    {progress}%
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats & Tips */}
            <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 px-1 mt-2">
                <span>{filtered.length} iniciativas activas con cronograma · {initiatives.filter(i => !i.start_date && !i.end_date).length} sin fechas.</span>
                <span>Usa zoom y scroll horizontal para navegar la línea de tiempo</span>
            </div>
        </div>
    );
};
