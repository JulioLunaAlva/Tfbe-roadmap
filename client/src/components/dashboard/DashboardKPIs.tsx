import { useState, useMemo } from 'react';
import {
    Zap, CheckCircle, AlertTriangle, Briefcase,
    ArrowUpRight, TrendingUp, Activity, Clock, RotateCcw, Timer, PauseCircle
} from 'lucide-react';
import { clsx } from 'clsx';
import { InitiativeListModal } from './InitiativeListModal';

interface KPIProps {
    total: number;
    completed: number;
    delayed: number;
    inProgress: number;
    completionRate: number;
    totalBudget?: number;
    initiatives: any[];
}

export const DashboardKPIs = ({ total, completed, delayed, inProgress, completionRate, initiatives }: KPIProps) => {
    const [selectedKPI, setSelectedKPI] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleKpiClick = (kpiName: string) => {
        setSelectedKPI(kpiName);
        setIsModalOpen(true);
    };

    const activeInitiatives = useMemo(() =>
        initiatives.filter(i => i.status !== 'Cancelada' && i.status !== 'Cancelado'),
        [initiatives]
    );

    const countByStatus = useMemo(() => {
        const map: Record<string, number> = {};
        activeInitiatives.forEach(i => {
            const s = i.status || 'On Hold';
            map[s] = (map[s] || 0) + 1;
        });
        return map;
    }, [activeInitiatives]);

    const refinedFilteredInitiatives = useMemo(() => {
        if (!selectedKPI || !initiatives) return [];
        switch (selectedKPI) {
            case 'Total Iniciativas':
                return activeInitiatives;
            case 'En Ejecución':
                return activeInitiatives.filter(i =>
                    i.status === 'En curso' ||
                    i.status === 'En redefinición' ||
                    i.status === 'Avance conforme plan'
                );
            case 'Riesgo / Retraso':
                return activeInitiatives.filter(i => i.status === 'Retrasado' || i.status === 'En riesgo');
            case 'Concluidas':
                return activeInitiatives.filter(i => i.status === 'Entregado');
            case 'Entregado con redefinición':
                return activeInitiatives.filter(i => i.status === 'Entregado con redefinición');
            case 'Entregado con atraso':
                return activeInitiatives.filter(i => i.status === 'Entregado con atraso');
            case 'Por Iniciar':
                return activeInitiatives.filter(i => i.status === 'Por Iniciar');
            case 'En redefinición': return activeInitiatives.filter(i => i.status === 'En redefinición'); case 'On Hold':
                return activeInitiatives.filter(i => i.status === 'On Hold' || i.status === 'En espera');
            default:
                return [];
        }
    }, [selectedKPI, initiatives, activeInitiatives]);

    const cardBase = "bg-white dark:bg-[#1E2630] rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group hover:shadow-md transition-all cursor-pointer";

    return (
        <>
            {/* Row 1 - existing 5 KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {/* Total Initiatives */}
                <div className={cardBase} onClick={() => handleKpiClick('Total Iniciativas')}>
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Zap size={64} className="text-blue-500" />
                    </div>
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                            <Briefcase size={20} />
                        </div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Iniciativas</span>
                    </div>
                    <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{total}</span>
                        <span className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full font-medium">Activas</span>
                    </div>
                </div>

                {/* Completion Rate */}
                <div className="bg-white dark:bg-[#1E2630] rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Activity size={64} className="text-emerald-500" />
                    </div>
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                            <CheckCircle size={20} />
                        </div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Tasa de Cierre</span>
                    </div>
                    <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{completionRate}%</span>
                        <div className="flex items-center text-xs text-emerald-600 font-medium ml-2">
                            <TrendingUp size={12} className="mr-1" />
                            <span>{completed} Entregados</span>
                        </div>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 h-1 mt-4 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${completionRate}%` }} />
                    </div>
                </div>

                {/* In Progress */}
                <div className={cardBase} onClick={() => handleKpiClick('En Ejecución')}>
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ArrowUpRight size={64} className="text-indigo-500" />
                    </div>
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                            <Activity size={20} />
                        </div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">En Ejecución</span>
                    </div>
                    <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{inProgress}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">En curso</span>
                    </div>
                </div>

                {/* Risk */}
                <div className={cardBase} onClick={() => handleKpiClick('Riesgo / Retraso')}>
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <AlertTriangle size={64} className="text-red-500" />
                    </div>
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
                            <AlertTriangle size={20} />
                        </div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Riesgo / Retraso</span>
                    </div>
                    <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{delayed}</span>
                        <span className={clsx("text-xs font-medium px-2 py-0.5 rounded-full", delayed > 0 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-gray-100 text-gray-600")}>
                            {delayed > 0 ? 'Requiere Atención' : 'Todo en Orden'}
                        </span>
                    </div>
                </div>

                {/* Completed */}
                <div className={cardBase} onClick={() => handleKpiClick('Concluidas')}>
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CheckCircle size={64} className="text-green-500" />
                    </div>
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
                            <CheckCircle size={20} />
                        </div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Concluidas</span>
                    </div>
                    <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{completed}</span>
                        <span className="text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full font-medium">Entregadas</span>
                    </div>
                    <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                        {total > 0 ? `${Math.round((completed / total) * 100)}% del total` : '0% del total'}
                    </div>
                </div>
            </div>

            {/* Row 2 - 4 new status KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                {/* Entregado con redefinición */}
                <div className={cardBase} onClick={() => handleKpiClick('Entregado con redefinición')}>
                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <RotateCcw size={48} className="text-orange-500" />
                    </div>
                    <div className="flex items-center space-x-2 mb-3">
                        <div className="p-1.5 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400">
                            <RotateCcw size={16} />
                        </div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-tight">Entregado con redefinición</span>
                    </div>
                    <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{countByStatus['Entregado con redefinición'] || 0}</span>
                        <span className="text-xs text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-full font-medium">Redefinición</span>
                    </div>
                </div>

                {/* Entregado con atraso */}
                <div className={cardBase} onClick={() => handleKpiClick('Entregado con atraso')}>
                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Timer size={48} className="text-red-400" />
                    </div>
                    <div className="flex items-center space-x-2 mb-3">
                        <div className="p-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-500 dark:text-red-400">
                            <Timer size={16} />
                        </div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-tight">Entregado con Atraso</span>
                    </div>
                    <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{countByStatus['Entregado con atraso'] || 0}</span>
                        <span className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full font-medium">Con Atraso</span>
                    </div>
                </div>

                {/* En redefinición */}
                <div className={cardBase} onClick={() => handleKpiClick('En redefinición')}>
                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <RotateCcw size={48} className="text-amber-500" />
                    </div>
                    <div className="flex items-center space-x-2 mb-3">
                        <div className="p-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600 dark:text-amber-400">
                            <RotateCcw size={16} />
                        </div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-tight">En redefinición</span>
                    </div>
                    <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{countByStatus['En redefinición'] || 0}</span>
                        <span className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full font-medium">Revisión</span>
                    </div>
                </div>

                {/* Por Iniciar */}
                <div className={cardBase} onClick={() => handleKpiClick('Por Iniciar')}>
                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Clock size={48} className="text-slate-400" />
                    </div>
                    <div className="flex items-center space-x-2 mb-3">
                        <div className="p-1.5 bg-slate-100 dark:bg-slate-700/30 rounded-lg text-slate-500 dark:text-slate-400">
                            <Clock size={16} />
                        </div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-tight">Por Iniciar</span>
                    </div>
                    <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">{countByStatus['Por Iniciar'] || 0}</span>
                        <span className="text-xs text-slate-600 bg-slate-100 dark:bg-slate-700/30 px-2 py-0.5 rounded-full font-medium">Pendiente</span>
                    </div>
                </div>

                {/* On Hold */}
                <div className={cardBase} onClick={() => handleKpiClick('On Hold')}>
                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <PauseCircle size={48} className="text-yellow-500" />
                    </div>
                    <div className="flex items-center space-x-2 mb-3">
                        <div className="p-1.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-600 dark:text-yellow-400">
                            <PauseCircle size={16} />
                        </div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-tight">On Hold</span>
                    </div>
                    <div className="flex items-baseline space-x-2">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {(countByStatus['On Hold'] || 0) + (countByStatus['En espera'] || 0)}
                        </span>
                        <span className="text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-0.5 rounded-full font-medium">En pausa</span>
                    </div>
                </div>
            </div>

            <InitiativeListModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Iniciativas: ${selectedKPI}`}
                initiatives={refinedFilteredInitiatives}
            />
        </>
    );
};