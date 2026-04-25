import { useState, useEffect, useMemo } from 'react';
import { BarChart3, ArrowUpDown, TrendingUp, TrendingDown, Minus, HelpCircle } from 'lucide-react';
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
    complexity?: string;
    champion?: string;
    transformation_lead?: string;
    is_top_priority?: boolean;
    is_key_initiative?: boolean;
    value?: string;
    tags?: string[];
}

type SortKey = 'name' | 'progress' | 'area' | 'status' | 'complexity' | 'value';

const getStatusBadge = (status?: string) => {
    const base = 'px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap';
    if (status === 'Entregado') return `${base} bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300`;
    if (status === 'En curso' || status === 'Avance conforme plan') return `${base} bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300`;
    if (status === 'Retrasado' || status === 'Atraso') return `${base} bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300`;
    if (status === 'En redefinición') return `${base} bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300`;
    if (status === 'Cancelado') return `${base} bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300`;
    return `${base} bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300`;
};

const getProgressBar = (progress: number) => {
    let color = 'bg-gray-400';
    if (progress >= 80) color = 'bg-emerald-500';
    else if (progress >= 50) color = 'bg-blue-500';
    else if (progress >= 25) color = 'bg-amber-500';
    else if (progress > 0) color = 'bg-red-400';

    return (
        <div className="flex items-center space-x-2 w-full">
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${progress}%` }} />
            </div>
            <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 w-8 text-right">{progress}%</span>
        </div>
    );
};

export const ComparativePage = () => {
    const { token } = useAuth();
    const { year } = useYear();
    const [initiatives, setInitiatives] = useState<Initiative[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortKey, setSortKey] = useState<SortKey>('progress');
    const [sortAsc, setSortAsc] = useState(false);
    const [compareIds, setCompareIds] = useState<string[]>([]);

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
            .catch(() => setLoading(false));
    }, [token, year]);

    const sorted = useMemo(() => {
        const data = compareIds.length > 0
            ? initiatives.filter(i => compareIds.includes(i.id))
            : [...initiatives];

        data.sort((a, b) => {
            let cmp = 0;
            switch (sortKey) {
                case 'name': cmp = a.name.localeCompare(b.name); break;
                case 'progress': cmp = (a.progress || 0) - (b.progress || 0); break;
                case 'area': cmp = (a.area || '').localeCompare(b.area || ''); break;
                case 'status': cmp = (a.status || '').localeCompare(b.status || ''); break;
                case 'complexity': {
                    const order: Record<string, number> = { 'Alta': 3, 'Media': 2, 'Baja': 1 };
                    cmp = (order[a.complexity || ''] || 0) - (order[b.complexity || ''] || 0);
                    break;
                }
                case 'value': cmp = (a.value || '').localeCompare(b.value || ''); break;
            }
            return sortAsc ? cmp : -cmp;
        });
        return data;
    }, [initiatives, sortKey, sortAsc, compareIds]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortAsc(!sortAsc);
        } else {
            setSortKey(key);
            setSortAsc(false);
        }
    };

    const toggleCompare = (id: string) => {
        setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const areaStats = useMemo(() => {
        const map = new Map<string, { total: number; avgProgress: number; delivered: number }>();
        initiatives.forEach(i => {
            const area = i.area || 'Sin Área';
            const prev = map.get(area) || { total: 0, avgProgress: 0, delivered: 0 };
            map.set(area, {
                total: prev.total + 1,
                avgProgress: prev.avgProgress + (i.progress || 0),
                delivered: prev.delivered + (i.status === 'Entregado' ? 1 : 0),
            });
        });
        // Calculate averages
        map.forEach((val, key) => {
            map.set(key, { ...val, avgProgress: Math.round(val.avgProgress / val.total) });
        });
        return map;
    }, [initiatives]);

    const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
        <th
            className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider cursor-pointer hover:text-indigo-500 transition-colors group"
            onClick={() => handleSort(field)}
        >
            <div className="flex items-center space-x-1">
                <span>{label}</span>
                <ArrowUpDown size={10} className={`transition-colors ${sortKey === field ? 'text-indigo-500' : 'text-gray-300 dark:text-gray-600 group-hover:text-indigo-400'}`} />
            </div>
        </th>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="w-full px-4 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg">
                        <BarChart3 size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Vista Comparativa</h2>
                        <p className="text-xs text-gray-400">
                            {compareIds.length > 0
                                ? `Comparando ${compareIds.length} iniciativas`
                                : `${initiatives.length} iniciativas · ${year}`
                            }
                        </p>
                    </div>
                </div>

                {compareIds.length > 0 && (
                    <button
                        onClick={() => setCompareIds([])}
                        className="text-xs text-gray-400 hover:text-rose-400 transition-colors px-2 py-1 rounded border border-gray-700 hover:border-rose-400"
                    >
                        Limpiar selección ({compareIds.length})
                    </button>
                )}
            </div>

            {/* Area Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {Array.from(areaStats.entries()).map(([area, stats]) => (
                    <div
                        key={area}
                        className="bg-white dark:bg-[#1E2630] rounded-lg border border-gray-200 dark:border-gray-700/50 p-3 hover:shadow-md transition-shadow"
                    >
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase truncate" title={area}>{area}</p>
                        <div className="flex items-baseline space-x-1 mt-1">
                            <span className="text-lg font-extrabold text-gray-800 dark:text-white">{stats.avgProgress}%</span>
                            <span className="text-[9px] text-gray-400">promedio</span>
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                            {stats.delivered}/{stats.total} entregadas
                        </p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#1E2630] rounded-xl border border-gray-200 dark:border-gray-700/50 overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700/50 bg-gray-50 dark:bg-[#1A2332]">
                                <th className="px-3 py-2.5 w-8">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 dark:border-gray-600"
                                        checked={compareIds.length === initiatives.length && initiatives.length > 0}
                                        onChange={() => {
                                            if (compareIds.length === initiatives.length) {
                                                setCompareIds([]);
                                            } else {
                                                setCompareIds(initiatives.map(i => i.id));
                                            }
                                        }}
                                    />
                                </th>
                                <SortHeader label="Iniciativa" field="name" />
                                <SortHeader label="Área" field="area" />
                                <SortHeader label="Avance" field="progress" />
                                <SortHeader label="Estatus" field="status" />
                                <SortHeader label="Complejidad" field="complexity" />
                                <SortHeader label="Valor" field="value" />
                                <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Tendencia</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                            {sorted.map((init) => {
                                const progress = init.progress || 0;
                                const isSelected = compareIds.includes(init.id);

                                return (
                                    <tr
                                        key={init.id}
                                        className={`transition-colors ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/10' : 'hover:bg-gray-50 dark:hover:bg-[#111827]/50'}`}
                                    >
                                        <td className="px-3 py-2.5">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 dark:border-gray-600"
                                                checked={isSelected}
                                                onChange={() => toggleCompare(init.id)}
                                            />
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div>
                                                <span className="text-xs font-bold text-gray-800 dark:text-white">{init.name}</span>
                                                {init.champion && (
                                                    <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">{init.champion}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <span className="text-[10px] text-gray-600 dark:text-gray-400">{init.area}</span>
                                        </td>
                                        <td className="px-3 py-2.5 min-w-[140px]">
                                            {getProgressBar(progress)}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <span className={getStatusBadge(init.status)}>{init.status || 'Sin estado'}</span>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <span className={`text-[10px] font-bold ${
                                                init.complexity === 'Alta' ? 'text-red-500' :
                                                init.complexity === 'Media' ? 'text-amber-500' :
                                                'text-green-500'
                                            }`}>
                                                {init.complexity || '-'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <span className="text-[10px] text-gray-600 dark:text-gray-400 truncate">{init.value || '-'}</span>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            {progress >= 70 ? <TrendingUp size={14} className="text-emerald-500" /> :
                                                progress >= 30 ? <Minus size={14} className="text-amber-500" /> :
                                                    <TrendingDown size={14} className="text-red-400" />}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
