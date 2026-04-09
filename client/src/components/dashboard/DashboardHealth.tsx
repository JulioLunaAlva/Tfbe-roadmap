import { CheckCircle2, Clock, AlertCircle, Sparkles, TrendingUp, TrendingDown, Minus, Activity, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import { useMemo } from 'react';

interface HealthProps {
    total: number;
    completed: number;
    delayed: number;
    inProgress: number;
}

export const DashboardHealth = ({ total, completed, delayed, inProgress }: HealthProps) => {
    // Score Calculation
    const healthScore = useMemo(() => {
        if (total === 0) return 0;
        const completionRate = (completed / total) * 100;
        const delayedRate = (delayed / total) * 100;
        const progressRate = (inProgress / total) * 100;
        const score = Math.round((completionRate * 0.4) + (Math.max(0, 100 - delayedRate * 2) * 0.4) + (progressRate * 0.2));
        return Math.min(100, Math.max(0, score));
    }, [total, completed, delayed, inProgress]);

    // Status Styling
    const status = useMemo(() => {
        if (healthScore >= 80) return { label: 'Óptimo', text: 'text-emerald-500', bg: 'bg-emerald-500', glow: 'shadow-emerald-500/30', icon: TrendingUp };
        if (healthScore >= 60) return { label: 'Estable', text: 'text-blue-500', bg: 'bg-blue-500', glow: 'shadow-blue-500/30', icon: Minus };
        if (healthScore >= 40) return { label: 'Riesgo Moderado', text: 'text-amber-500', bg: 'bg-amber-500', glow: 'shadow-amber-500/30', icon: TrendingDown };
        return { label: 'Crítico', text: 'text-rose-500', bg: 'bg-rose-500', glow: 'shadow-rose-500/30', icon: AlertCircle };
    }, [healthScore]);

    // Prescriptive Analytics Engine (Smart Insights 2.0)
    const insights = useMemo(() => {
        if (total === 0) return [{ title: 'Esperando Datos', text: 'Sin datos para generar insights en este periodo.', priority: 'Baja', color: 'text-gray-500', bg: 'bg-gray-500/10' }];
        const recs = [];

        const delayedRate = delayed / total;
        const progressRate = inProgress / total;

        // 1. Critical Delay Impact
        if (delayed > 0) {
            const dragPoint = Math.round(delayedRate * 2 * 40); // Reverse calculation of scoring drag
            recs.push({
                title: 'Impacto de Retrasos',
                text: `${delayed} iniciativa(s) en riesgo arrastran la salud global un -${dragPoint}%. Resolverlas restauraría el índice a fase estable.`,
                priority: delayed > 2 ? 'Crítica' : 'Alta',
                color: 'text-rose-500',
                bg: 'bg-rose-500/10'
            });
        }

        // 2. Bottleneck Analysis
        if (progressRate > 0.6) {
            recs.push({
                title: 'Cuello de Botella Operativo',
                text: `El ${Math.round(progressRate * 100)}% del portafolio está en "WIP" (Work in Progress). Reducir el inventario paralelo acelerará las entregas.`,
                priority: progressRate > 0.8 ? 'Alta' : 'Media',
                color: 'text-amber-500',
                bg: 'bg-amber-500/10'
            });
        } else if (inProgress > 0 && healthScore >= 70) {
            recs.push({
                title: 'Flujo Continuo',
                text: 'La carga de trabajo circulante es óptima. El equipo procesa entregables a un ritmo altamente predecible.',
                priority: 'Baja',
                color: 'text-blue-500',
                bg: 'bg-blue-500/10'
            });
        }

        // 3. Completion Trajectory
        if (completed / total >= 0.5) {
            recs.push({
                title: 'Hito de Superávit',
                text: 'Más de la mitad del portafolio entregado. Excelente momento para enfocar recursos en planeación del próximo ciclo.',
                priority: 'Baja',
                color: 'text-emerald-500',
                bg: 'bg-emerald-500/10'
            });
        }

        // 4. Default if empty but not critical
        if (recs.length === 0 && delayed === 0) {
            recs.push({
                title: 'Control Total',
                text: 'Desempeño nominal detectado en todos los frentes. No se requiere intervención ejecutiva.',
                priority: 'Info',
                color: 'text-emerald-500',
                bg: 'bg-emerald-500/10'
            });
        }

        return recs.sort((a, b) => {
            const pMap: Record<string, number> = { 'Crítica': 4, 'Alta': 3, 'Media': 2, 'Baja': 1, 'Info': 0 };
            return pMap[b.priority] - pMap[a.priority];
        });
    }, [total, completed, delayed, inProgress, healthScore]);

    // Top insight highlighted
    const primaryInsight = insights[0];
    const secondaryInsights = insights.slice(1, 3);

    // SVG Dual Ring Physics
    const size = 200;
    const center = size / 2;
    const outerRadius = 85;
    const innerRadius = 65;
    
    // Outer Ring (Score)
    const outCirc = 2 * Math.PI * outerRadius;
    const outDash = (outCirc / 24) - 2;
    const outOffset = outCirc - (healthScore / 100) * outCirc;

    // Inner Ring (Proportions)
    const inCirc = 2 * Math.PI * innerRadius;
    const pComp = total ? completed / total : 0;
    const pProg = total ? inProgress / total : 0;
    const pDel = total ? delayed / total : 0;

    return (
        <div className="bg-white dark:bg-[#1E2630] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 h-full flex flex-col transition-all duration-300">
            {/* Header */}
            <div className="mb-6 flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
                        <span className="p-1.5 bg-fuchsia-500/10 text-fuchsia-500 rounded-lg mr-3">
                            <Activity size={20} />
                        </span>
                        Salud del Portafolio
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-1">
                        Motor Analítico 2.0 &bull; Impacto Predictivo
                    </p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col md:flex-row gap-6">
                
                {/* Visual HUD Sector */}
                <div className="flex flex-col items-center justify-center min-w-[220px]">
                    <div className="relative w-52 h-52 group">
                        {/* Dynamic Aura */}
                        <div className={clsx(
                            "absolute inset-4 rounded-full blur-[40px] opacity-25 transition-all duration-1000",
                            status.bg
                        )} />

                        {/* Dual Ring SVG */}
                        <svg viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90 w-full h-full drop-shadow-md relative z-10">
                            {/* Inner Ring (Track) */}
                            <circle cx={center} cy={center} r={innerRadius} fill="transparent" stroke="currentColor" strokeWidth="8" className="text-gray-100 dark:text-gray-800/40" />
                            {/* Inner Ring: Completed */}
                            <circle cx={center} cy={center} r={innerRadius} fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray={`${pComp * inCirc} ${inCirc}`} strokeDashoffset={0} className="text-emerald-500 transition-all duration-1000" />
                            {/* Inner Ring: Progress */}
                            <circle cx={center} cy={center} r={innerRadius} fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray={`${pProg * inCirc} ${inCirc}`} strokeDashoffset={-(pComp * inCirc)} className="text-blue-500 transition-all duration-1000" />
                            {/* Inner Ring: Delayed */}
                            <circle cx={center} cy={center} r={innerRadius} fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray={`${pDel * inCirc} ${inCirc}`} strokeDashoffset={-((pComp + pProg) * inCirc)} className="text-rose-500 transition-all duration-1000" />
                            
                            {/* Outer Ring (Track) */}
                            <circle cx={center} cy={center} r={outerRadius} fill="transparent" stroke="currentColor" strokeWidth="12" strokeDasharray={`${outDash} 2`} className="text-gray-200 dark:text-gray-800/80" />
                            {/* Outer Ring: Score */}
                            <circle cx={center} cy={center} r={outerRadius} fill="transparent" stroke="url(#scoreGradient)" strokeWidth="12" strokeDasharray={`${outDash} 2`} strokeDashoffset={outOffset} className="transition-all duration-1000 ease-out" />
                            
                            {/* Defs */}
                            <defs>
                                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="currentColor" className={status.text} />
                                    <stop offset="100%" stopColor="currentColor" className={status.text} />
                                </linearGradient>
                            </defs>
                        </svg>

                        {/* Core Metric Display */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 mt-2">
                            <status.icon className={clsx("w-5 h-5 mb-1", status.text)} />
                            <div className="flex items-baseline">
                                <span className={clsx("text-5xl font-black tracking-tighter drop-shadow-sm", status.text === 'text-gray-500' ? 'text-gray-800 dark:text-white' : status.text)}>
                                    {healthScore}
                                </span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mt-1">
                                {status.label}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Analytical Data Sector */}
                <div className="flex-1 flex flex-col border-l border-gray-100 dark:border-gray-800/50 pl-6 h-full">
                    
                    {/* Primary Prescriptive Insight */}
                    {primaryInsight && (
                        <div className={clsx("rounded-2xl p-4 mb-4 border transition-colors", primaryInsight.bg, primaryInsight.color.replace('text-', 'border-') + '/30')}>
                            <div className="flex items-start">
                                <div className={clsx("p-2 rounded-lg bg-white/50 dark:bg-black/20 mr-3 mt-1", primaryInsight.color)}>
                                    <Sparkles size={16} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <h5 className={clsx("text-xs font-bold uppercase tracking-wider", primaryInsight.color)}>Alerta Prescriptiva</h5>
                                        <span className="text-[9px] font-black uppercase text-gray-400 dark:text-gray-500 px-2 py-0.5 rounded-full bg-gray-200/50 dark:bg-gray-800/50">Prioridad: {primaryInsight.priority}</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug">
                                        {primaryInsight.text}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Secondary Metrics / Micro-trends */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        {[
                            { label: 'Entrega', value: completed, color: 'text-emerald-500', icon: CheckCircle2, pct: Math.round(pComp*100) },
                            { label: 'Ritmo', value: inProgress, color: 'text-blue-500', icon: Clock, pct: Math.round(pProg*100) },
                            { label: 'Riesgo', value: delayed, color: 'text-rose-500', icon: AlertCircle, pct: Math.round(pDel*100) }
                        ].map((m) => (
                            <div key={m.label} className="flex flex-col p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800/80">
                                <div className="flex justify-between items-center mb-2">
                                    <m.icon size={12} className={m.color} />
                                    <span className="text-[10px] text-gray-500 font-bold">{m.pct}%</span>
                                </div>
                                <div className="text-lg font-black text-gray-900 dark:text-white leading-none">{m.value}</div>
                                <div className="text-[9px] font-bold text-gray-400 uppercase mt-1">{m.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Secondary Insights List */}
                    {secondaryInsights.length > 0 && (
                        <div className="flex-1 border-t border-gray-100 dark:border-gray-800/50 pt-3">
                            <h6 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Contexto Adicional</h6>
                            <ul className="space-y-2">
                                {secondaryInsights.map((rec, idx) => (
                                    <li key={idx} className="flex items-start text-xs text-gray-600 dark:text-gray-400">
                                        <ArrowRight size={12} className={clsx("mt-0.5 mr-2 shrink-0", rec.color)} />
                                        <span><strong className="text-gray-800 dark:text-gray-300 font-semibold">{rec.title}:</strong> {rec.text}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};
