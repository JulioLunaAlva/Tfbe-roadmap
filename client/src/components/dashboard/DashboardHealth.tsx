import { CheckCircle2, Clock, AlertCircle, BarChart3, ShieldAlert, Box, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { useMemo } from 'react';

interface HealthProps {
    total: number;
    completed: number;
    delayed: number;
    inProgress: number;
}

export const DashboardHealth = ({ total, completed, delayed, inProgress }: HealthProps) => {
    // Score Calculation - Explicit and deterministic
    const healthScore = useMemo(() => {
        if (total === 0) return 0;
        const completionRate = (completed / total) * 100;
        const delayedRate = (delayed / total) * 100;
        const progressRate = (inProgress / total) * 100;
        const score = Math.round((completionRate * 0.4) + (Math.max(0, 100 - delayedRate * 2) * 0.4) + (progressRate * 0.2));
        return Math.min(100, Math.max(0, score));
    }, [total, completed, delayed, inProgress]);

    // Status logic
    const getStatusInfo = () => {
        if (healthScore >= 80) return { title: 'SALUDABLE', text: 'text-emerald-500', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' };
        if (healthScore >= 60) return { title: 'ESTABLE', text: 'text-blue-500', border: 'border-blue-500/30', bg: 'bg-blue-500/10' };
        if (healthScore >= 40) return { title: 'ATENCIÓN REQUERIDA', text: 'text-amber-500', border: 'border-amber-500/30', bg: 'bg-amber-500/10' };
        return { title: 'CRÍTICO', text: 'text-rose-500', border: 'border-rose-500/30', bg: 'bg-rose-500/10' };
    };

    const status = getStatusInfo();

    // Redundant proportions calculation
    const compPct = total ? Math.round((completed / total) * 100) : 0;
    const progPct = total ? Math.round((inProgress / total) * 100) : 0;
    const delPct = total ? Math.round((delayed / total) * 100) : 0;

    // Diagnostic Logs
    const diagnostics = useMemo(() => {
        if (total === 0) return ['Sin iniciativas activas en el portafolio.'];
        const logs = [];
        logs.push(`Portafolio activo con ${total} iniciativas tecnológicas en total.`);
        
        if (delayed > 0) {
            logs.push(`ALERTA: ${delayed} iniciativa${delayed > 1 ? 's' : ''} (${delPct}%) registran un retraso contra su fecha planificada.`);
        } else {
            logs.push(`Cero iniciativas en estado de retraso. Cronograma cumpliendo expectativas.`);
        }

        if (progPct > 60) {
            logs.push(`Sobrecarga detectada: ${progPct}% del pipeline se encuentra bloqueado en "En Curso".`);
        } else {
            logs.push(`Flujo de trabajo "En Curso" (${progPct}%) operando sin cuellos de botella masivos.`);
        }

        if (compPct > 0) {
            logs.push(`Tasa de finalización actual: ${compPct}%. (Total entregado: ${completed}).`);
        }

        return logs;
    }, [total, completed, delayed, compPct, progPct, delPct]);

    return (
        <div className="bg-white dark:bg-[#1A232E] rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 h-full flex flex-col justify-between overflow-y-auto custom-scrollbar">
            {/* Header: Dense Data Approach */}
            <div className="flex flex-col mb-4">
                <div className="flex justify-between items-end mb-2">
                    <h3 className="text-sm font-black text-gray-800 dark:text-gray-100 flex items-center tracking-wide uppercase">
                        <BarChart3 size={16} className="mr-2 text-indigo-500" />
                        Diagnóstico del Portafolio
                    </h3>
                    <span className={clsx("text-xs font-black px-2 py-0.5 rounded border", status.text, status.bg, status.border)}>
                        {status.title}
                    </span>
                </div>
                <div className="flex items-baseline space-x-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                    <span className={clsx("text-4xl font-black tracking-tighter leading-none", status.text === 'text-gray-500' ? 'text-gray-900 dark:text-white' : status.text)}>
                        {healthScore}
                    </span>
                    <span className="text-sm font-bold text-gray-400">/ 100 pt</span>
                </div>
            </div>

            {/* Middle: Horizontal Data Bars (Extreme Redundancy) */}
            <div className="flex flex-col space-y-3 flex-1 mb-4">
                
                {/* Completed Row */}
                <div className="flex flex-col">
                    <div className="flex justify-between text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">
                        <span className="flex items-center text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 size={12} className="mr-1" /> Completadas
                        </span>
                        <span>{completed} de {total} ({compPct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-sm h-3 overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div 
                            className="bg-emerald-500 h-full transition-all duration-700"
                            style={{ width: `${compPct}%` }}
                        />
                    </div>
                </div>

                {/* In Progress Row */}
                <div className="flex flex-col">
                    <div className="flex justify-between text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">
                        <span className="flex items-center text-blue-600 dark:text-blue-400">
                            <RefreshCw size={12} className="mr-1" /> En Progreso
                        </span>
                        <span>{inProgress} de {total} ({progPct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-sm h-3 overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div 
                            className="bg-blue-500 h-full transition-all duration-700"
                            style={{ width: `${progPct}%` }}
                        />
                    </div>
                </div>

                {/* Delayed Row */}
                <div className="flex flex-col">
                    <div className="flex justify-between text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">
                        <span className="flex items-center text-rose-600 dark:text-rose-400">
                            <ShieldAlert size={12} className="mr-1" /> Riesgo / Retraso
                        </span>
                        <span>{delayed} de {total} ({delPct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-sm h-3 overflow-hidden border border-gray-200 dark:border-gray-700">
                        <div 
                            className="bg-rose-500 h-full transition-all duration-700"
                            style={{ width: `${delPct}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Bottom: Explicit Text Logs (Redundant context) */}
            <div className="bg-gray-50 dark:bg-[#151C24] border border-gray-100 dark:border-gray-800/80 rounded-md p-3">
                <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2 flex items-center">
                    <Box size={10} className="mr-1" /> Contexto Analítico Detallado
                </h4>
                <ul className="space-y-1.5 border-l-2 border-indigo-500/30 pl-2">
                    {diagnostics.map((log, i) => (
                        <li key={i} className="text-[11px] text-gray-600 dark:text-gray-400 font-medium leading-tight">
                            {log.includes('ALERTA') ? (
                                <span className="text-rose-500 dark:text-rose-400 font-bold">{log}</span>
                            ) : (
                                log
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};
