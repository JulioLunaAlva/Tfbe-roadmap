import { useState, useEffect, useMemo } from 'react';
import { BarChart3, ArrowUpDown, TrendingUp, TrendingDown, Minus } from 'lucide-react';
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
    const [compareIds, setCompareIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterArea, setFilterArea] = useState<string | null>(null);

    const getAreaColor = (area: string) => {
        const areaColors: Record<string, { bg: string; text: string; border: string }> = {
            'PLANEACIÓN FINANCIERA': { bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-200' },
            'DIRECCIÓN FINANZAS': { bg: 'bg-indigo-500', text: 'text-indigo-600', border: 'border-indigo-200' },
            'TESORERÍA CORPORATIVA': { bg: 'bg-cyan-500', text: 'text-cyan-600', border: 'border-cyan-200' },
            'KFS-REPSE': { bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-200' },
            'KFS - R2R': { bg: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-200' },
            'KFS-CASH MANAGEMENT': { bg: 'bg-purple-500', text: 'text-purple-600', border: 'border-purple-200' },
            'FINANZAS MÉXICO': { bg: 'bg-rose-500', text: 'text-rose-600', border: 'border-rose-200' },
            'GRC': { bg: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-200' },
            'INF. FIN & NORM.': { bg: 'bg-teal-500', text: 'text-teal-600', border: 'border-teal-200' },
            'FISCAL CORPORATIVO': { bg: 'bg-violet-500', text: 'text-violet-600', border: 'border-violet-200' },
            'CONTRALORÍA HOLDING': { bg: 'bg-sky-500', text: 'text-sky-600', border: 'border-sky-200' },
            'CONTROL DE ACCESOS': { bg: 'bg-fuchsia-500', text: 'text-fuchsia-600', border: 'border-fuchsia-200' },
            'ABASTECIMIENTOS COE': { bg: 'bg-lime-500', text: 'text-lime-600', border: 'border-lime-200' },
            'KFS-COMPLIANCE': { bg: 'bg-yellow-500', text: 'text-yellow-600', border: 'border-yellow-200' },
            'TRANSFORMACIÓN': { bg: 'bg-blue-600', text: 'text-blue-700', border: 'border-blue-300' },
            'FINANZAS GUATEMALA': { bg: 'bg-emerald-600', text: 'text-emerald-700', border: 'border-emerald-300' },
            'FISCAL GUATEMALA': { bg: 'bg-indigo-600', text: 'text-indigo-700', border: 'border-indigo-300' },
            'FISCAL- MÉXICO': { bg: 'bg-rose-600', text: 'text-rose-700', border: 'border-rose-300' },
        };
        return areaColors[area.toUpperCase()] || { bg: 'bg-gray-500', text: 'text-gray-600', border: 'border-gray-200' };
    };

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

    const filteredAndSorted = useMemo(() => {
        let data = [...initiatives];
        
        // Search filter
        if (searchTerm) {
            const lowSearch = searchTerm.toLowerCase();
            data = data.filter(i => 
                i.name.toLowerCase().includes(lowSearch) || 
                i.area.toLowerCase().includes(lowSearch) ||
                (i.champion || '').toLowerCase().includes(lowSearch)
            );
        }

        // Area filter
        if (filterArea) {
            data = data.filter(i => i.area === filterArea);
        }

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
    }, [initiatives, sortKey, sortAsc, searchTerm, filterArea]);

    const selectedStats = useMemo(() => {
        if (compareIds.length === 0) return null;
        const selected = initiatives.filter(i => compareIds.includes(i.id));
        const avg = Math.round(selected.reduce((acc, curr) => acc + (curr.progress || 0), 0) / selected.length);
        const delivered = selected.filter(i => i.status === 'Entregado').length;
        return { avg, delivered, total: selected.length };
    }, [initiatives, compareIds]);

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
            className="px-4 py-3 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest cursor-pointer hover:text-indigo-500 transition-colors group"
            onClick={() => handleSort(field)}
        >
            <div className="flex items-center space-x-1">
                <span>{label}</span>
                <ArrowUpDown size={12} className={`transition-colors ${sortKey === field ? 'text-indigo-500' : 'text-gray-300 dark:text-gray-600 group-hover:text-indigo-400'}`} />
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg ring-4 ring-blue-500/10">
                        <BarChart3 size={24} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">Vista Comparativa</h2>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center mt-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                            {initiatives.length} iniciativas totales · {year}
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <input
                            type="text"
                            placeholder="Buscar iniciativa..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full text-xs bg-white dark:bg-[#1E2630] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm"
                        />
                    </div>
                    {compareIds.length > 0 && (
                        <button
                            onClick={() => setCompareIds([])}
                            className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-4 py-2.5 rounded-xl border border-rose-100 dark:border-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all"
                        >
                            Limpiar ({compareIds.length})
                        </button>
                    )}
                </div>
            </div>

            {/* Explanation / Intro */}
            <div className="bg-gradient-to-r from-indigo-500/5 to-purple-500/5 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-4">
                <h3 className="text-sm font-bold text-indigo-700 dark:text-indigo-400 mb-1 flex items-center">
                    <span className="mr-2">💡</span> ¿Cómo funciona esta pantalla?
                </h3>
                <p className="text-xs text-indigo-600/80 dark:text-indigo-400/80 leading-relaxed">
                    Compara el desempeño entre áreas usando las tarjetas superiores. <strong>Haz clic en una tarjeta</strong> para filtrar la tabla. 
                    Usa los <strong>checkboxes</strong> para seleccionar iniciativas específicas y ver un resumen comparativo en tiempo real.
                </p>
            </div>

            {/* Area Summary Cards (Horizontal Scroll if many) */}
            <div className="flex space-x-4 overflow-x-auto pb-2 custom-scrollbar">
                {Array.from(areaStats.entries()).map(([area, stats]) => {
                    const isSelected = filterArea === area;
                    return (
                        <button
                            key={area}
                            onClick={() => setFilterArea(isSelected ? null : area)}
                            className={`flex-shrink-0 w-48 p-4 rounded-2xl border transition-all duration-300 text-left ${
                                isSelected 
                                ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-500/20 ring-4 ring-indigo-500/10' 
                                : 'bg-white dark:bg-[#1E2630] border-gray-200 dark:border-gray-700/50 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md'
                            }`}
                        >
                            <p className={`text-[10px] font-black uppercase tracking-widest truncate ${isSelected ? 'text-indigo-100' : 'text-gray-400 dark:text-gray-500'}`} title={area}>
                                {area}
                            </p>
                            <div className="flex items-baseline space-x-1 mt-2">
                                <span className={`text-2xl font-black ${isSelected ? 'text-white' : 'text-gray-800 dark:text-white'}`}>
                                    {stats.avgProgress}%
                                </span>
                                <span className={`text-[10px] font-medium ${isSelected ? 'text-indigo-200' : 'text-gray-400'}`}>avg</span>
                            </div>
                            <div className={`mt-3 h-1.5 w-full rounded-full overflow-hidden ${isSelected ? 'bg-indigo-400/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 ${isSelected ? 'bg-white' : 'bg-indigo-500'}`}
                                    style={{ width: `${stats.avgProgress}%` }}
                                />
                            </div>
                            <p className={`text-[10px] font-bold mt-2 ${isSelected ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'}`}>
                                {stats.delivered}/{stats.total} Entregadas
                            </p>
                        </button>
                    );
                })}
            </div>

            {/* Comparison Toolbar (Selected Items) */}
            {selectedStats && (
                <div className="bg-indigo-600 rounded-2xl p-4 text-white shadow-xl shadow-indigo-500/20 flex flex-wrap items-center justify-between gap-4 animate-in slide-in-from-bottom-4">
                    <div className="flex items-center space-x-6">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">Seleccionadas</p>
                            <p className="text-xl font-black">{selectedStats.total}</p>
                        </div>
                        <div className="w-px h-8 bg-indigo-400/30" />
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">Avance Promedio</p>
                            <p className="text-xl font-black">{selectedStats.avg}%</p>
                        </div>
                        <div className="w-px h-8 bg-indigo-400/30" />
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">Entregadas</p>
                            <p className="text-xl font-black">{selectedStats.delivered}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                         <span className="text-xs font-medium text-indigo-100">Comparando rendimiento entre iniciativas seleccionadas</span>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white dark:bg-[#1E2630] rounded-2xl border border-gray-200 dark:border-gray-700/50 overflow-hidden shadow-xl ring-1 ring-gray-900/5">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700/50 bg-gray-50/50 dark:bg-[#1A2332]/50 backdrop-blur-sm">
                                <th className="px-4 py-4 w-12">
                                    <div className="flex items-center justify-center">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded-md border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                            checked={compareIds.length === filteredAndSorted.length && filteredAndSorted.length > 0}
                                            onChange={() => {
                                                if (compareIds.length === filteredAndSorted.length) {
                                                    setCompareIds([]);
                                                } else {
                                                    setCompareIds(filteredAndSorted.map(i => i.id));
                                                }
                                            }}
                                        />
                                    </div>
                                </th>
                                <SortHeader label="Iniciativa" field="name" />
                                <SortHeader label="Área" field="area" />
                                <SortHeader label="Avance" field="progress" />
                                <SortHeader label="Estatus" field="status" />
                                <SortHeader label="Complejidad" field="complexity" />
                                <SortHeader label="Valor" field="value" />
                                <th className="px-4 py-4 text-left text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Tendencia</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                            {filteredAndSorted.map((init) => {
                                const progress = init.progress || 0;
                                const isSelected = compareIds.includes(init.id);
                                const areaColor = getAreaColor(init.area);
 
                                return (
                                    <tr
                                        key={init.id}
                                        className={`group transition-all duration-200 ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'}`}
                                    >
                                        <td className="px-4 py-4">
                                            <div className="flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded-md border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                    checked={isSelected}
                                                    onChange={() => toggleCompare(init.id)}
                                                />
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 max-w-xs">
                                            <div className="flex flex-col">
                                                <span className={`text-[13px] font-bold transition-colors ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-200'}`}>
                                                    {init.name}
                                                </span>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    {init.champion && (
                                                        <span className="text-[10px] font-medium text-gray-400 flex items-center">
                                                            <span className="w-1 h-1 rounded-full bg-gray-300 mr-1" />
                                                            {init.champion}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${isSelected ? 'bg-white/50 border-indigo-200 dark:bg-indigo-900/50 dark:border-indigo-800' : 'bg-gray-50 border-gray-100 dark:bg-gray-800/50 dark:border-gray-700'} ${areaColor.text}`}>
                                                {init.area}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 min-w-[160px]">
                                            <div className="flex flex-col space-y-1">
                                                {getProgressBar(progress)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={getStatusBadge(init.status)}>{init.status || 'Sin estado'}</span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`text-[10px] font-black uppercase ${
                                                init.complexity === 'Alta' ? 'text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-2 py-0.5 rounded' :
                                                init.complexity === 'Media' ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded' :
                                                'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded'
                                            }`}>
                                                {init.complexity || '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="max-w-[120px]">
                                                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 line-clamp-2 leading-tight">
                                                    {init.value || '-'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className={`p-1.5 rounded-lg w-fit ${
                                                progress >= 70 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500' :
                                                progress >= 30 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-500' :
                                                'bg-rose-50 dark:bg-rose-900/20 text-rose-500'
                                            }`}>
                                                {progress >= 70 ? <TrendingUp size={16} /> :
                                                    progress >= 30 ? <Minus size={16} /> :
                                                        <TrendingDown size={16} />}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredAndSorted.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-full mb-3">
                                                <BarChart3 size={24} className="text-gray-300" />
                                            </div>
                                            <p className="text-sm font-bold text-gray-400">No se encontraron iniciativas</p>
                                            <button 
                                                onClick={() => { setSearchTerm(''); setFilterArea(null); }}
                                                className="mt-2 text-xs text-indigo-500 font-bold hover:underline"
                                            >
                                                Limpiar filtros
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
