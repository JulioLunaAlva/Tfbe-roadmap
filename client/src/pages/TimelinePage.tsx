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

const getStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-400 dark:bg-gray-600';
    if (status === 'Entregado') return 'bg-emerald-500';
    if (status === 'En curso' || status === 'Avance conforme plan') return 'bg-blue-500';
    if (status === 'Retrasado' || status === 'Atraso') return 'bg-red-500';
    if (status === 'En redefinición') return 'bg-amber-500';
    if (status === 'Cancelado') return 'bg-rose-600';
    return 'bg-gray-400 dark:bg-gray-600';
};

const getAreaColor = (area: string) => {
    const colors = [
        'border-l-violet-500', 'border-l-blue-500', 'border-l-emerald-500',
        'border-l-amber-500', 'border-l-rose-500', 'border-l-cyan-500',
        'border-l-indigo-500', 'border-l-teal-500', 'border-l-orange-500',
        'border-l-fuchsia-500', 'border-l-lime-500', 'border-l-pink-500',
    ];
    let hash = 0;
    for (let i = 0; i < area.length; i++) hash = area.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
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
                        <h2 className="text-xl font-bold text-white">Timeline de Iniciativas</h2>
                        <p className="text-xs text-gray-400">
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
                            <span className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Iniciativa / Tags</span>
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
                            {Array.from(grouped.entries()).map(([area, inits]) => (
                                <div key={area}>
                                    {/* Area header */}
                                    <div className="px-4 py-2 bg-indigo-50/50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-900/30">
                                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center">
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2" />
                                            {area}
                                        </span>
                                    </div>
                                    {inits.map(init => (
                                        <div
                                            key={init.id}
                                            className={`flex flex-col justify-center px-4 border-b border-gray-100 dark:border-gray-800/50 transition-colors cursor-default border-l-[3px] ${getAreaColor(init.area)} ${hoveredId === init.id ? 'bg-indigo-50 dark:bg-indigo-900/10' : 'hover:bg-gray-50 dark:hover:bg-[#111827]/30'}`}
                                            style={{ height: rowHeight + 12 }}
                                            onMouseEnter={() => setHoveredId(init.id)}
                                            onMouseLeave={() => setHoveredId(null)}
                                        >
                                            <span className="text-[11px] font-bold text-gray-700 dark:text-gray-200 truncate leading-tight" title={init.name}>
                                                {init.name}
                                            </span>
                                            {init.tags && init.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {init.tags.slice(0, 2).map(tag => (
                                                        <span key={tag} className="text-[8px] px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium truncate max-w-[80px]">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    {init.tags.length > 2 && <span className="text-[8px] text-gray-400">+{init.tags.length - 2}</span>}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ))}
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
                                    <div className="bg-indigo-50/10 dark:bg-indigo-900/5 border-b border-indigo-100 dark:border-indigo-900/10" style={{ height: 26 }} />
                                    
                                    {inits.map(init => {
                                        const bar = getBarPosition(init.start_date, init.end_date);
                                        const progress = init.progress || 0;

                                        return (
                                            <div
                                                key={init.id}
                                                className={`relative border-b border-gray-100 dark:border-gray-800/50 transition-colors ${hoveredId === init.id ? 'bg-indigo-50/30 dark:bg-indigo-900/5' : ''}`}
                                                style={{ height: rowHeight + 12 }}
                                                onMouseEnter={() => setHoveredId(init.id)}
                                                onMouseLeave={() => setHoveredId(null)}
                                            >
                                                {bar && (
                                                    <div
                                                        className={`absolute top-2 rounded-lg shadow-md overflow-hidden transition-all duration-300 group cursor-pointer ${hoveredId === init.id ? 'scale-[1.02] z-10' : 'z-5'}`}
                                                        style={{
                                                            left: bar.left,
                                                            width: bar.width,
                                                            height: rowHeight,
                                                        }}
                                                        title={`${init.name}\nInicio: ${init.start_date || 'N/A'}\nFin: ${init.end_date || 'N/A'}\nAvance: ${progress}%\nEstatus: ${init.status || 'N/A'}`}
                                                    >
                                                        {/* Base Gradient Background */}
                                                        <div className={`absolute inset-0 ${getStatusColor(init.status)} opacity-20`} />
                                                        
                                                        {/* Progress Fill with Shimmer effect */}
                                                        <div
                                                            className={`absolute inset-y-0 left-0 ${getStatusColor(init.status)} opacity-80 shadow-[0_0_15px_rgba(0,0,0,0.1)] transition-all relative overflow-hidden`}
                                                            style={{ width: `${progress}%` }}
                                                        >
                                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" style={{ transform: 'translateX(-100%)' }} />
                                                        </div>

                                                        {/* Label Overlay */}
                                                        <div className="relative z-10 px-2 flex items-center h-full gap-2">
                                                            {bar.width > 120 && (
                                                                <span className="text-[10px] font-bold text-white drop-shadow-md truncate">
                                                                    {init.name}
                                                                </span>
                                                            )}
                                                            <span className="text-[9px] font-extrabold text-white bg-black/20 px-1.5 py-0.5 rounded ml-auto flex-shrink-0">
                                                                {progress}%
                                                            </span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-800/30 p-2 rounded-lg border border-gray-100 dark:border-gray-800/50">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span>{filtered.length} iniciativas activas con cronograma · {initiatives.filter(i => !i.start_date && !i.end_date).length} sin fechas.</span>
                </div>
                <div className="flex items-center justify-end space-x-4 text-[10px] uppercase font-bold tracking-wider text-gray-400">
                    <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" /> Entregado</div>
                    <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5" /> En Curso</div>
                    <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-1.5" /> Retrasado</div>
                </div>
            </div>
        </div>
    );
};
