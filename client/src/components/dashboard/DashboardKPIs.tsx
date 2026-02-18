
import {
    Zap, CheckCircle, AlertTriangle, Briefcase,
    ArrowUpRight, TrendingUp, Activity
} from 'lucide-react';
import { clsx } from 'clsx';

interface KPIProps {
    total: number;
    completed: number;
    delayed: number;
    inProgress: number;
    completionRate: number;
    totalBudget?: number; // Placeholder for complexity/effort proxy
}

export const DashboardKPIs = ({ total, completed, delayed, inProgress, completionRate }: KPIProps) => {

    // Status Logic


    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">{/* Total Initiatives Card */}
            <div className="bg-white dark:bg-[#1E2630] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group hover:shadow-md transition-all">
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

            {/* Completion Rate Card */}
            <div className="bg-white dark:bg-[#1E2630] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group hover:shadow-md transition-all">
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
                {/* Mini Progress Bar */}
                <div className="w-full bg-gray-100 dark:bg-gray-700 h-1 mt-4 rounded-full overflow-hidden">
                    <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                        style={{ width: `${completionRate}%` }}
                    />
                </div>
            </div>

            {/* In Progress Card */}
            <div className="bg-white dark:bg-[#1E2630] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group hover:shadow-md transition-all">
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

            {/* Risk Card */}
            <div className="bg-white dark:bg-[#1E2630] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group hover:shadow-md transition-all">
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

            {/* Completed Initiatives Card */}
            <div className="bg-white dark:bg-[#1E2630] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group hover:shadow-md transition-all">
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
                    <span className="text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full font-medium">
                        Entregadas
                    </span>
                </div>
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    {total > 0 ? `${Math.round((completed / total) * 100)}% del total` : '0% del total'}
                </div>
            </div>
        </div>
    );
};
