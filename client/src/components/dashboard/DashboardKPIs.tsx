
import { useState, useMemo } from 'react';
import {
    Zap, CheckCircle, AlertTriangle, Briefcase,
    ArrowUpRight, TrendingUp, Activity
} from 'lucide-react';
import { clsx } from 'clsx';
import { InitiativeListModal } from './InitiativeListModal';

interface KPIProps {
    total: number;
    completed: number;
    delayed: number;
    inProgress: number;
    completionRate: number;
    totalBudget?: number; // Placeholder for complexity/effort proxy
    initiatives: any[];
}

export const DashboardKPIs = ({ total, completed, delayed, inProgress, completionRate, initiatives }: KPIProps) => {
    const [selectedKPI, setSelectedKPI] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleKpiClick = (kpiName: string) => {
        setSelectedKPI(kpiName);
        setIsModalOpen(true);
    };

    const refinedFilteredInitiatives = useMemo(() => {
        if (!selectedKPI || !initiatives) return [];

        const activeInitiatives = initiatives.filter(i => i.status !== 'Cancelada' && i.status !== 'Cancelado');

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
            default:
                return [];
        }
    }, [selectedKPI, initiatives]);

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">{/* Total Initiatives Card */}
                <div
                    className="card card-hover relative overflow-hidden group cursor-pointer p-6"
                    onClick={() => handleKpiClick('Total Iniciativas')}
                >
                    <div className="absolute right-0 top-0 p-4 opacity-[0.06] group-hover:opacity-[0.10] transition-opacity">
                        <Zap size={64} className="text-zinc-600 dark:text-zinc-300" />
                    </div>
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-300">
                            <Briefcase size={20} />
                        </div>
                        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Iniciativas</span>
                    </div>
                    <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">{total}</span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md font-medium">Activas</span>
                    </div>
                </div>

                {/* Completion Rate Card */}
                <div className="card card-hover relative overflow-hidden group p-6">
                    <div className="absolute right-0 top-0 p-4 opacity-[0.06] group-hover:opacity-[0.10] transition-opacity">
                        <Activity size={64} className="text-emerald-500" />
                    </div>
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                            <CheckCircle size={20} />
                        </div>
                        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Tasa de Cierre</span>
                    </div>
                    <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">{completionRate}%</span>
                        <div className="flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-medium ml-2">
                            <TrendingUp size={12} className="mr-1" />
                            <span>{completed} Entregados</span>
                        </div>
                    </div>
                    {/* Mini Progress Bar */}
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1 mt-4 rounded-full overflow-hidden">
                        <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                            style={{ width: `${completionRate}%` }}
                        />
                    </div>
                </div>

                {/* In Progress Card */}
                <div
                    className="card card-hover relative overflow-hidden group cursor-pointer p-6"
                    onClick={() => handleKpiClick('En Ejecución')}
                >
                    <div className="absolute right-0 top-0 p-4 opacity-[0.06] group-hover:opacity-[0.10] transition-opacity">
                        <ArrowUpRight size={64} className="text-zinc-600 dark:text-zinc-300" />
                    </div>
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-300">
                            <Activity size={20} />
                        </div>
                        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">En Ejecución</span>
                    </div>
                    <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">{inProgress}</span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">En curso</span>
                    </div>
                </div>

                {/* Risk Card */}
                <div
                    className="card card-hover relative overflow-hidden group cursor-pointer p-6"
                    onClick={() => handleKpiClick('Riesgo / Retraso')}
                >
                    <div className="absolute right-0 top-0 p-4 opacity-[0.06] group-hover:opacity-[0.10] transition-opacity">
                        <AlertTriangle size={64} className="text-red-500" />
                    </div>
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
                            <AlertTriangle size={20} />
                        </div>
                        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Riesgo / Retraso</span>
                    </div>
                    <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">{delayed}</span>
                        <span className={clsx("text-xs font-medium px-2 py-0.5 rounded-md", delayed > 0 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400")}>
                            {delayed > 0 ? 'Requiere Atención' : 'Todo en Orden'}
                        </span>
                    </div>
                </div>

                {/* Completed Initiatives Card */}
                <div
                    className="card card-hover relative overflow-hidden group cursor-pointer p-6"
                    onClick={() => handleKpiClick('Concluidas')}
                >
                    <div className="absolute right-0 top-0 p-4 opacity-[0.06] group-hover:opacity-[0.10] transition-opacity">
                        <CheckCircle size={64} className="text-emerald-500" />
                    </div>
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                            <CheckCircle size={20} />
                        </div>
                        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Concluidas</span>
                    </div>
                    <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">{completed}</span>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-md font-medium">
                            Entregadas
                        </span>
                    </div>
                    <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                        {total > 0 ? `${Math.round((completed / total) * 100)}% del total` : '0% del total'}
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
