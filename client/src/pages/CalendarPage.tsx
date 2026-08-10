import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useYear } from '../context/YearContext';
import API_URL from '../config/api';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter, Search, Clock, CheckCircle2, AlertCircle, PlayCircle, XCircle } from 'lucide-react';
import { clsx } from 'clsx';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    eachDayOfInterval,
    parseISO,
    isWithinInterval
} from 'date-fns';
import { es } from 'date-fns/locale';

interface Initiative {
    id: string;
    name: string;
    area: string;
    status?: string;
    start_date?: string;
    end_date?: string;
    progress?: number;
    champion?: string;
}

const STATUS_COLORS: Record<string, string> = {
    'Entregado': 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
    'En curso': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    'Avance conforme plan': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    'Retrasado': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    'Atraso': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    'En redefinición': 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    'Cancelado': 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800',
};

const getStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-zinc-800 dark:text-gray-300 dark:border-zinc-700';
    return STATUS_COLORS[status] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-zinc-800 dark:text-gray-300 dark:border-zinc-700';
};

const getStatusIcon = (status?: string) => {
    switch (status) {
        case 'Entregado': return <CheckCircle2 size={12} className="mr-1" />;
        case 'En curso':
        case 'Avance conforme plan': return <PlayCircle size={12} className="mr-1" />;
        case 'Retrasado':
        case 'Atraso': return <AlertCircle size={12} className="mr-1" />;
        case 'Cancelado': return <XCircle size={12} className="mr-1" />;
        default: return <Clock size={12} className="mr-1" />;
    }
};

export const CalendarPage = () => {
    const { token } = useAuth();
    const { year } = useYear();
    const [initiatives, setInitiatives] = useState<Initiative[]>([]);

    // Calendar state
    const [currentMonth, setCurrentMonth] = useState(new Date(year, new Date().getMonth(), 1));
    const [selectedArea, setSelectedArea] = useState<string>('Todas');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchInitiatives = async () => {
            try {
                const res = await fetch(`${API_URL}/api/initiatives?year=${year}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Error fetching initiatives');
                const data = await res.json();
                setInitiatives(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error(err);
            }
        };

        if (token) fetchInitiatives();
    }, [token, year]);

    // Keep currentMonth in sync with the global year context if year changes significantly
    useEffect(() => {
        if (currentMonth.getFullYear() !== year) {
            setCurrentMonth(new Date(year, currentMonth.getMonth(), 1));
        }
    }, [year]);

    const areas = useMemo(() => {
        const uniqueAreas = new Set(initiatives.map(i => i.area).filter(Boolean));
        return ['Todas', ...Array.from(uniqueAreas).sort()];
    }, [initiatives]);

    // Filter initiatives that have dates
    const filteredInitiatives = useMemo(() => {
        return initiatives.filter(i => {
            if (!i.start_date || !i.end_date) return false;
            
            const matchesArea = selectedArea === 'Todas' || i.area === selectedArea;
            const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  (i.champion && i.champion.toLowerCase().includes(searchQuery.toLowerCase()));
            
            return matchesArea && matchesSearch;
        });
    }, [initiatives, selectedArea, searchQuery]);

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    // Generate calendar days
    const daysInMonth = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

        return eachDayOfInterval({ start: startDate, end: endDate });
    }, [currentMonth]);

    const getInitiativesForDay = (date: Date) => {
        return filteredInitiatives.filter(i => {
            if (!i.start_date || !i.end_date) return false;
            try {
                const start = parseISO(i.start_date);
                const end = parseISO(i.end_date);
                // Reset time portion for accurate day comparison
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                const compareDate = new Date(date);
                compareDate.setHours(12, 0, 0, 0);

                return isWithinInterval(compareDate, { start, end });
            } catch {
                return false;
            }
        });
    };

    return (
        <div className="h-full flex flex-col bg-[var(--bg-primary)] fade-in">
            {/* Header */}
            <div className="flex-none p-6 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                            <CalendarIcon className="text-red-500" />
                            Calendario de Ejecución
                        </h1>
                        <p className="text-[var(--text-secondary)] mt-1">Vista mensual de iniciativas activas</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar iniciativa..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full sm:w-64 pl-9 pr-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-sm focus:outline-none focus:border-red-500 text-[var(--text-primary)] transition-colors"
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2">
                            <Filter size={16} className="text-gray-400" />
                            <select
                                value={selectedArea}
                                onChange={(e) => setSelectedArea(e.target.value)}
                                className="bg-transparent border-none text-sm focus:outline-none text-[var(--text-primary)]"
                            >
                                {areas.map(area => (
                                    <option key={area} value={area}>{area}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Calendar Controls */}
            <div className="flex-none px-6 py-4 flex items-center justify-between bg-[var(--bg-primary)]">
                <h2 className="text-xl font-semibold text-[var(--text-primary)] capitalize">
                    {format(currentMonth, 'MMMM yyyy', { locale: es })}
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={prevMonth}
                        className="p-2 border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={() => setCurrentMonth(new Date(year, new Date().getMonth(), 1))}
                        className="px-4 py-2 border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm font-medium transition-colors"
                    >
                        Hoy
                    </button>
                    <button
                        onClick={nextMonth}
                        className="p-2 border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-auto p-6 pt-0">
                <div className="min-w-[800px] h-full flex flex-col">
                    {/* Days of week header */}
                    <div className="grid grid-cols-7 gap-px border-b border-[var(--border-color)] mb-2">
                        {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => (
                            <div key={day} className="py-2 text-center text-sm font-semibold text-[var(--text-secondary)]">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days grid */}
                    <div className="flex-1 grid grid-cols-7 gap-2 auto-rows-fr">
                        {daysInMonth.map((day) => {
                            const isCurrentMonth = isSameMonth(day, currentMonth);
                            const isToday = isSameDay(day, new Date());
                            const dayInitiatives = getInitiativesForDay(day);

                            return (
                                <div 
                                    key={day.toString()} 
                                    className={clsx(
                                        "min-h-[120px] p-2 rounded-lg border flex flex-col",
                                        isCurrentMonth 
                                            ? "bg-[var(--bg-secondary)] border-[var(--border-color)]" 
                                            : "bg-[var(--bg-primary)] border-transparent opacity-50",
                                        isToday && "ring-2 ring-red-500 border-transparent"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={clsx(
                                            "text-sm font-medium flex items-center justify-center w-6 h-6 rounded-full",
                                            isToday 
                                                ? "bg-red-500 text-white" 
                                                : "text-[var(--text-primary)]"
                                        )}>
                                            {format(day, 'd')}
                                        </span>
                                        {dayInitiatives.length > 0 && (
                                            <span className="text-xs font-semibold text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">
                                                {dayInitiatives.length}
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5">
                                        {dayInitiatives.map(initiative => {
                                            const isStart = isSameDay(day, parseISO(initiative.start_date!));
                                            const isEnd = isSameDay(day, parseISO(initiative.end_date!));
                                            
                                            return (
                                                <div 
                                                    key={initiative.id}
                                                    title={`${initiative.name}\nÁrea: ${initiative.area}\nEstatus: ${initiative.status || 'No definido'}`}
                                                    className={clsx(
                                                        "text-xs p-1.5 rounded border shadow-sm flex items-center truncate cursor-help transition-transform hover:scale-[1.02]",
                                                        getStatusColor(initiative.status),
                                                        isStart && "border-l-4",
                                                        isEnd && "border-r-4",
                                                        (!isStart && !isEnd) && "border-transparent opacity-80"
                                                    )}
                                                >
                                                    {getStatusIcon(initiative.status)}
                                                    <span className="truncate">{initiative.name}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
