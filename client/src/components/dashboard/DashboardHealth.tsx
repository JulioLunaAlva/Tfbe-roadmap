
import { Gauge, CheckCircle2, Clock, AlertCircle, Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { clsx } from 'clsx';

interface HealthProps {
    total: number;
    completed: number;
    delayed: number;
    inProgress: number;
}

export const DashboardHealth = ({ total, completed, delayed, inProgress }: HealthProps) => {
    // Calculate health score (0-100)
    const calculateHealthScore = () => {
        if (total === 0) return 0;

        const completionRate = (completed / total) * 100;
        const delayedRate = (delayed / total) * 100;
        const progressRate = (inProgress / total) * 100;

        const score = Math.round(
            (completionRate * 0.4) +
            (Math.max(0, 100 - delayedRate * 2) * 0.4) +
            (progressRate * 0.2)
        );

        return Math.min(100, Math.max(0, score));
    };

    const healthScore = calculateHealthScore();

    const getHealthStatus = (score: number) => {
        if (score >= 80) return { 
            label: 'Excelente', 
            color: 'text-emerald-500', 
            fill: 'fill-emerald-500', 
            bg: 'bg-emerald-500', 
            glow: 'shadow-emerald-500/20',
            icon: TrendingUp
        };
        if (score >= 60) return { 
            label: 'Saludable', 
            color: 'text-blue-500', 
            fill: 'fill-blue-500', 
            bg: 'bg-blue-500', 
            glow: 'shadow-blue-500/20',
            icon: Minus
        };
        if (score >= 40) return { 
            label: 'Atención', 
            color: 'text-amber-500', 
            fill: 'fill-amber-500', 
            bg: 'bg-amber-500', 
            glow: 'shadow-amber-500/20',
            icon: TrendingDown
        };
        return { 
            label: 'Crítico', 
            color: 'text-rose-500', 
            fill: 'fill-rose-500', 
            bg: 'bg-rose-500', 
            glow: 'shadow-rose-500/20',
            icon: AlertCircle
        };
    };

    const status = getHealthStatus(healthScore);
    const StatusIcon = status.icon;

    // SVG Constants for Gauge
    const size = 200;
    const center = size / 2;
    const radius = 80;
    const strokeWidth = 14;
    const circumference = 2 * Math.PI * radius;
    const dashLength = (circumference / 20) - 2; // 20 segments
    const dashArray = `${dashLength} 2`;
    const offset = circumference - (healthScore / 100) * circumference;

    const getRecommendations = () => {
        const recommendations = [];
        if (delayed > 0) recommendations.push({
            text: `${delayed} iniciativa${delayed > 1 ? 's' : ''} requiere${delayed === 1 ? '' : 'n'} atención inmediata por retraso crítico.`,
            priority: 'Alta',
            color: 'text-rose-500',
            bg: 'bg-rose-500/10'
        });
        if (completed / total < 0.5) recommendations.push({
            text: 'Baja tasa de cierre detectada. Priorizar la entrega de hitos finales este mes.',
            priority: 'Media',
            color: 'text-amber-500',
            bg: 'bg-amber-500/10'
        });
        if (inProgress > total * 0.7) recommendations.push({
            text: 'Alta saturación "En Curso". Riesgo de cuellos de botella en el equipo.',
            priority: 'Media',
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
        });
        
        if (recommendations.length === 0) recommendations.push({
            text: 'Operación óptima. Mantener el ritmo actual de ejecución y seguimiento.',
            priority: 'Baja',
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10'
        });
        return recommendations;
    };

    return (
        <div className="bg-white dark:bg-[#1E2630] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 h-full flex flex-col transition-all duration-300 hover:shadow-md">
            <div className="mb-8 flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
                        <span className="p-1.5 bg-teal-500/10 text-teal-500 rounded-lg mr-3">
                            <Sparkles size={20} />
                        </span>
                        Salud del Portafolio
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-1">
                        Índice de eficiencia operativa basado en KPIs actuales
                    </p>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center">
                {/* HUD Gauge Component */}
                <div className="relative w-48 h-48 mb-8 group">
                    {/* Glowing Aura Background */}
                    <div className={clsx(
                        "absolute inset-4 rounded-full blur-3xl opacity-20 transition-all duration-1000",
                        status.bg
                    )} />
                    
                    <svg viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90 w-full h-full drop-shadow-sm">
                        {/* Shadow/Track Background */}
                        <circle
                            cx={center}
                            cy={center}
                            r={radius}
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth={strokeWidth}
                            strokeDasharray={dashArray}
                            className="text-gray-100 dark:text-gray-800/50"
                        />
                        {/* Active Health Progress Ring */}
                        <circle
                            cx={center}
                            cy={center}
                            r={radius}
                            fill="transparent"
                            stroke="url(#healthGradient)"
                            strokeWidth={strokeWidth}
                            strokeDasharray={dashArray}
                            strokeDashoffset={offset}
                            className="transition-all duration-1000 ease-out"
                            strokeLinecap="butt"
                        />
                        {/* Gradient Definition */}
                        <defs>
                            <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="currentColor" className={status.color} />
                                <stop offset="100%" stopColor="currentColor" className={status.color} />
                            </linearGradient>
                        </defs>
                    </svg>

                    {/* Center HUD Info */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <div className={clsx("mb-1 transition-transform duration-500 group-hover:scale-110", status.color)}>
                            <StatusIcon size={24} />
                        </div>
                        <div className="flex items-baseline">
                            <span className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter">
                                {healthScore}
                            </span>
                            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 ml-1">
                                PT
                            </span>
                        </div>
                        <div className={clsx(
                            "mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700",
                            status.color
                        )}>
                            {status.label}
                        </div>
                    </div>
                </div>

                {/* Metrics Matrix HUD */}
                <div className="grid grid-cols-3 gap-3 w-full mb-8">
                    {[
                        { label: 'Entrega', value: completed, color: 'text-emerald-500', bg: 'bg-emerald-500/5', icon: CheckCircle2 },
                        { label: 'Ritmo', value: inProgress, color: 'text-blue-500', bg: 'bg-blue-500/5', icon: Clock },
                        { label: 'Riesgo', value: delayed, color: 'text-rose-500', bg: 'bg-rose-500/5', icon: AlertCircle }
                    ].map((m) => (
                        <div key={m.label} className={clsx("relative flex flex-col items-center p-3 rounded-2xl border border-transparent transition-all hover:border-gray-100 dark:hover:border-gray-800", m.bg)}>
                            <m.icon size={14} className={clsx("mb-2 opacity-50", m.color)} />
                            <div className="text-xl font-black text-gray-900 dark:text-white">{m.value}</div>
                            <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter mt-1">{m.label}</div>
                        </div>
                    ))}
                </div>

                {/* Intelligent Insights HUD */}
                <div className="w-full space-y-3">
                    <h4 className="flex items-center text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-3">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2 animate-pulse" />
                        Smart Insights
                    </h4>
                    
                    <div className="space-y-2">
                        {getRecommendations().map((rec, idx) => (
                            <div 
                                key={idx} 
                                className={clsx(
                                    "p-3 rounded-xl border border-transparent flex items-start group transition-all hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm",
                                    rec.bg
                                )}
                            >
                                <div className={clsx("mt-1 mr-3 flex-shrink-0", rec.color)}>
                                    <Sparkles size={14} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className={clsx("text-[9px] font-black uppercase tracking-wider", rec.color)}>
                                            Prioridad {rec.priority}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed group-hover:text-gray-900 dark:group-hover:text-white">
                                        {rec.text}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
