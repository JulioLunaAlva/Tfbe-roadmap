import React, { useMemo, useState } from 'react';
import {
    TrendingUp, Zap, Sparkles, UserCheck, DollarSign,
    ExternalLink, CheckCircle2, Clock, FileQuestion,
    ShieldCheck, Database, Scale, Cpu, Eye, Gauge, ChevronsUpDown
} from 'lucide-react';
import { clsx } from 'clsx';
import {
    isNAPillar,
    isPillarCompleted,
    isPendingDocumentation,
    isSubstantivePillar,
    isUnquantifiedPillarText,
    analyzePortfolioValue,
    getMergedOperationalEfficiencyText,
    stripHtml
} from '../../utils/exportValue';

export interface InitiativeSummaryItem {
    id: string;
    name: string;
    area: string;
    status?: string;
    transformation_lead?: string;
    champion?: string;
    progress?: number;
}

export interface ValueRecord {
    business_value?: string;
    operational_efficiency?: string;
    fte_detail?: string;
    qualitative_benefit?: string;
    users_reached_detail?: string;
    estimated_savings_detail?: string;
}

interface ConsolidatedValueDashboardProps {
    initiatives: InitiativeSummaryItem[];
    allValues: Record<string, ValueRecord>;
    pillarSummary: Record<string, number>;
    onSelectInitiative: (id: string, name: string) => void;
}

interface ExtractedBullet {
    id: string;
    text: string;
    initiative: InitiativeSummaryItem;
    highlightBadge?: string;
    isUnquantified?: boolean;
    score: number;
}

/**
 * Extracts a short quantitative badge if present in the text (e.g. "$125,000 USD", "6,800 MDP", "387.5 hrs/sem", "8 FTE", "64 usuarios", "222x")
 */
const extractHighlightBadge = (text: string): string | undefined => {
    const patterns = [
        /\$\s*[0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?\s*(?:USD|MXN|MDP|MMUSD)?/i,
        /[0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?\s*(?:MM\s*USD|MMUSD|MDP|USD)/i,
        /[0-9]+(?:\.[0-9]+)?\s*(?:hrs?|horas?)\s*\/\s*(?:semana|mes|a[ñn]o)/i,
        /[0-9]+(?:\.[0-9]+)?\s*(?:hrs?|horas?)\s*(?:semanales|mensuales|anuales)/i,
        /[0-9]+(?:\.[0-9]+)?\s*FTEs?\b/i,
        /[0-9]+\s*x\b/i,
        /[0-9]{1,3}(?:,[0-9]{3})*\s*(?:usuarios?|usurarios?|personas?|colaboradores?|oficiales?|oficilaes?)/i,
        /[0-9]+(?:\.[0-9]+)?%\s*(?:de\s+)?(?:reducci[oó]n|ahorro|mejora|dso|avance)/i,
    ];

    for (const regex of patterns) {
        const match = text.match(regex);
        if (match) {
            return match[0]
                .replace(/usurarios/i, 'usuarios')
                .replace(/oficilaes/i, 'oficiales')
                .trim();
        }
    }
    return undefined;
};

/**
 * Extracts ALL substantive initiative entries for a given pillar, sorted by impact relevance
 * (quantified impacts first, qualitative second, "No cuantificado" last, excluding "Documentación pendiente").
 */
const extractAllPillarItems = (
    initiatives: InitiativeSummaryItem[],
    allValues: Record<string, ValueRecord>,
    pillarKey: keyof ValueRecord
): ExtractedBullet[] => {
    const items: ExtractedBullet[] = [];

    for (const init of initiatives) {
        const record = allValues[init.id];
        const val =
            pillarKey === 'operational_efficiency'
                ? getMergedOperationalEfficiencyText(record as Record<string, string> | undefined)
                : record?.[pillarKey];
        if (!isSubstantivePillar(val)) continue;

        const clean = stripHtml(val);
        if (!clean || isNAPillar(clean) || isPendingDocumentation(clean)) continue;

        const lines = clean
            .split('\n')
            .map(l => l.replace(/^[•\-\*–—\d\.\)]\s*/, '').trim())
            .filter(l => l.length > 3 && !isNAPillar(l) && !isPendingDocumentation(l));

        if (lines.length === 0) continue;

        const combinedText = lines.join(' • ');
        const unquantified = isUnquantifiedPillarText(combinedText);
        const highlightBadge = !unquantified ? extractHighlightBadge(combinedText) : undefined;

        let score = 10;
        if (unquantified) {
            score = 1;
        } else if (highlightBadge) {
            score = 30;
        } else if (/[0-9]+/.test(combinedText)) {
            score = 20;
        }

        items.push({
            id: `${init.id}-${pillarKey}`,
            text: combinedText,
            initiative: init,
            highlightBadge,
            isUnquantified: unquantified,
            score,
        });
    }

    return items.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.initiative.name.localeCompare(b.initiative.name);
    });
};

// Categorías cualitativas detectadas
interface CategoryBadge {
    name: string;
    count: number;
    icon: any;
    color: string;
    bg: string;
    sampleInitiatives: InitiativeSummaryItem[];
}

const detectQualitativeCategories = (
    initiatives: InitiativeSummaryItem[],
    allValues: Record<string, ValueRecord>
): CategoryBadge[] => {
    const categoryRules = [
        { name: 'Mitigación de Riesgos', keywords: ['riesgo', 'mitiga', 'auditor', 'vulnerab'], icon: ShieldCheck, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800/40' },
        { name: 'Calidad de Datos', keywords: ['calidad', 'consisten', 'precisi', 'integridad'], icon: Database, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800/40' },
        { name: 'Cumplimiento & Normativa', keywords: ['cumplimiento', 'normativ', 'fiscal', 'legal', 'sox'], icon: Scale, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800/40' },
        { name: 'Automatización & RPA', keywords: ['automatiz', 'rpa', 'robot', 'digital'], icon: Cpu, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/40' },
        { name: 'Visibilidad & Control', keywords: ['visibilidad', 'trazabil', 'control', 'gobernanza'], icon: Eye, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/40' },
        { name: 'Agilidad Operativa', keywords: ['agil', 'tiempo', 'velocidad', 'productiv'], icon: Gauge, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800/40' },
    ];

    const results: CategoryBadge[] = [];

    for (const rule of categoryRules) {
        const matchedInits: InitiativeSummaryItem[] = [];
        for (const init of initiatives) {
            const raw = allValues[init.id]?.qualitative_benefit;
            if (!isSubstantivePillar(raw)) continue;
            const text = stripHtml(raw).toLowerCase();
            if (rule.keywords.some(kw => text.includes(kw))) {
                matchedInits.push(init);
            }
        }
        if (matchedInits.length > 0) {
            results.push({
                name: rule.name,
                count: matchedInits.length,
                icon: rule.icon,
                color: rule.color,
                bg: rule.bg,
                sampleInitiatives: matchedInits
            });
        }
    }

    if (results.length === 0) {
        const initsWithQual = initiatives.filter(i => isSubstantivePillar(allValues[i.id]?.qualitative_benefit));
        if (initsWithQual.length > 0) {
            results.push(
                { name: 'Eficiencia y Calidad', count: initsWithQual.length, icon: Sparkles, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800/40', sampleInitiatives: initsWithQual },
                { name: 'Gobernanza & Cumplimiento', count: Math.ceil(initsWithQual.length / 2), icon: ShieldCheck, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800/40', sampleInitiatives: initsWithQual }
            );
        }
    }

    return results;
};

// ─── Tarjeta Individual dentro del Scroll de cada Pilar ──────────────────────────

const ScrollablePillarItem: React.FC<{
    bullet: ExtractedBullet;
    accentDotClass: string;
    accentBadgeClass: string;
    onClick: () => void;
}> = ({ bullet, accentDotClass, accentBadgeClass, onClick }) => {
    return (
        <div
            onClick={onClick}
            title={`Clic para abrir "${bullet.initiative.name}" (${bullet.initiative.area || 'General'})`}
            className={clsx(
                'group relative cursor-pointer p-2.5 rounded-lg transition-all duration-150 text-xs flex flex-col gap-1 border',
                bullet.isUnquantified
                    ? 'bg-gray-50/50 dark:bg-gray-800/25 border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/60'
                    : 'bg-gray-50/70 dark:bg-gray-800/40 border-gray-100/90 dark:border-gray-700/50 text-gray-700 dark:text-gray-200 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 hover:border-indigo-200 dark:hover:border-indigo-800/60'
            )}
        >
            {/* Header row: Initiative Name + Area + Highlight Badge + External Link Icon */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                    <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', accentDotClass)} />
                    <span className="font-bold text-[11px] text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {bullet.initiative.name}
                    </span>
                    {bullet.initiative.area && (
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate hidden sm:inline">
                            · {bullet.initiative.area}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                    {bullet.highlightBadge && (
                        <span className={clsx('px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tabular-nums', accentBadgeClass)}>
                            {bullet.highlightBadge}
                        </span>
                    )}
                    {bullet.isUnquantified && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-gray-200/70 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400">
                            Por cuantificar
                        </span>
                    )}
                    <ExternalLink
                        size={12}
                        className="opacity-40 group-hover:opacity-100 text-indigo-500 dark:text-indigo-400 transition-opacity flex-shrink-0"
                    />
                </div>
            </div>

            {/* Full impact description */}
            <p className="text-[11px] leading-relaxed text-gray-600 dark:text-gray-300 pl-3">
                {bullet.text}
            </p>
        </div>
    );
};

// ─── Contenedor Scrollable Reutilizable para cada Pilar ──────────────────────────

const PillarScrollList: React.FC<{
    title: string;
    items: ExtractedBullet[];
    emptyText: string;
    accentDotClass: string;
    accentBadgeClass: string;
    maxHeightClass?: string;
    onSelectInitiative: (id: string, name: string) => void;
}> = ({
    title,
    items,
    emptyText,
    accentDotClass,
    accentBadgeClass,
    maxHeightClass = 'max-h-[230px]',
    onSelectInitiative
}) => {
    return (
        <div className="flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    {title} ({items.length})
                </p>
                {items.length > 2 && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                        <ChevronsUpDown size={11} />
                        <span>Scroll para ver más</span>
                    </span>
                )}
            </div>

            {items.length > 0 ? (
                <div
                    className={clsx(
                        'space-y-1.5 overflow-y-auto pr-1 custom-scrollbar',
                        maxHeightClass
                    )}
                >
                    {items.map(bullet => (
                        <ScrollablePillarItem
                            key={bullet.id}
                            bullet={bullet}
                            accentDotClass={accentDotClass}
                            accentBadgeClass={accentBadgeClass}
                            onClick={() => onSelectInitiative(bullet.initiative.id, bullet.initiative.name)}
                        />
                    ))}
                </div>
            ) : (
                <p className="text-xs text-gray-400 italic py-3">{emptyText}</p>
            )}
        </div>
    );
};

// ─── Componente Principal ────────────────────────────────────────────────────────

export const ConsolidatedValueDashboard: React.FC<ConsolidatedValueDashboardProps> = ({
    initiatives,
    allValues,
    onSelectInitiative
}) => {
    const [showAllAreas, setShowAllAreas] = useState(false);

    // Estadísticas analíticas consolidadas compartidas con PDF y Excel
    const stats = useMemo(
        () => analyzePortfolioValue(initiatives, allValues as Record<string, Record<string, string>>),
        [initiatives, allValues]
    );

    // Listas completas desplazables para cada uno de los 5 pilares
    const businessBullets = useMemo(
        () => extractAllPillarItems(initiatives, allValues, 'business_value'),
        [initiatives, allValues]
    );
    const operationalBullets = useMemo(
        () => extractAllPillarItems(initiatives, allValues, 'operational_efficiency'),
        [initiatives, allValues]
    );
    const qualitativeBullets = useMemo(
        () => extractAllPillarItems(initiatives, allValues, 'qualitative_benefit'),
        [initiatives, allValues]
    );
    const usersBullets = useMemo(
        () => extractAllPillarItems(initiatives, allValues, 'users_reached_detail'),
        [initiatives, allValues]
    );
    const savingsBullets = useMemo(
        () => extractAllPillarItems(initiatives, allValues, 'estimated_savings_detail'),
        [initiatives, allValues]
    );

    const qualitativeCategories = useMemo(
        () => detectQualitativeCategories(initiatives, allValues),
        [initiatives, allValues]
    );

    const pendingMgmtInitiatives = useMemo(() => {
        return initiatives.filter(init => {
            const v = allValues[init.id];
            if (!v) return false;
            const vals = [
                v.business_value,
                getMergedOperationalEfficiencyText(v as Record<string, string>),
                v.qualitative_benefit,
                v.users_reached_detail,
                v.estimated_savings_detail
            ];
            return vals.some(p => isPendingDocumentation(p)) && vals.filter(p => isPillarCompleted(p)).length < 5;
        });
    }, [initiatives, allValues]);

    return (
        <div className="flex-1 flex flex-col space-y-4 min-h-0 overflow-y-auto custom-scrollbar pb-6">
            {/* ─── 1. Cabecera Compacta y Contadores de Estado ─────────────────────────── */}
            <div className="bg-white dark:bg-[#1E2630] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">
                            Dashboard Ejecutivo de Impacto & Valor
                        </h3>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Consolidado analítico de los 5 pilares estratégicos en{' '}
                        <span className="font-semibold text-gray-700 dark:text-gray-200">
                            {stats.totalInits} iniciativas
                        </span>
                        . Desplázate dentro de cada pilar o haz clic en cualquier iniciativa para ver y editar su detalle.
                    </p>
                </div>

                {/* Contadores horizontales alineados a la derecha */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Completas */}
                    <div
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40"
                        title="Iniciativas con los 5 pilares sustantivamente documentados (o N/A justificado)"
                    >
                        <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        <div>
                            <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300 font-mono tabular-nums">
                                {stats.completeInits}
                            </span>
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 ml-1 font-medium">
                                Completas
                            </span>
                        </div>
                    </div>

                    {/* En Progreso / Pendiente por Gerencia */}
                    <div
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40"
                        title={
                            pendingMgmtInitiatives.length > 0
                                ? `Incluye pendientes por gerencia: ${pendingMgmtInitiatives.map(i => i.name).join(', ')}`
                                : 'Iniciativas con documentación parcial'
                        }
                    >
                        <Clock size={15} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
                        <div>
                            <span className="text-xs font-extrabold text-amber-700 dark:text-amber-300 font-mono tabular-nums">
                                {stats.partialInits}
                            </span>
                            <span className="text-[11px] text-amber-600 dark:text-amber-400 ml-1 font-medium">
                                {pendingMgmtInitiatives.length > 0 ? 'Pend. Gerencia / Parcial' : 'En Progreso'}
                            </span>
                        </div>
                    </div>

                    {/* Sin Documentar */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/60">
                        <FileQuestion size={15} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        <div>
                            <span className="text-xs font-extrabold text-gray-700 dark:text-gray-300 font-mono tabular-nums">
                                {stats.emptyInits}
                            </span>
                            <span className="text-[11px] text-gray-500 dark:text-gray-400 ml-1 font-medium">
                                Sin Documentar
                            </span>
                        </div>
                    </div>

                    {/* Barra de progreso */}
                    <div className="w-28 pl-1">
                        <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1">
                            <span>Adopción Real</span>
                            <span className="text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">
                                {stats.pctGlobalComplete}%
                            </span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-500"
                                style={{ width: `${stats.pctGlobalComplete}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── 2. Grid Consolidado de 5 Pilares (3 superiores + 2 inferiores amplios) ──── */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">

                {/* PILAR 1: VALOR DE NEGOCIO (Violeta) */}
                <div className="xl:col-span-2 bg-white dark:bg-[#1E2630] rounded-xl shadow-sm border border-violet-100 dark:border-violet-900/40 p-5 flex flex-col justify-between hover:shadow-md transition-all">
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-violet-100 dark:bg-violet-900/50 rounded-lg text-violet-600 dark:text-violet-400">
                                    <TrendingUp size={18} />
                                </div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                                    Valor de Negocio
                                </h4>
                            </div>
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 border border-violet-200/50 dark:border-violet-800/40 font-mono tabular-nums">
                                {stats.hasBusiness} de {stats.totalInits}
                            </span>
                        </div>

                        {/* Top KPI row */}
                        <div className="grid grid-cols-2 gap-2 mb-3.5 p-3 bg-violet-50/50 dark:bg-violet-950/20 rounded-xl border border-violet-100/60 dark:border-violet-900/30">
                            <div>
                                <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">
                                    Alineación
                                </span>
                                <p className="text-xl font-black text-violet-700 dark:text-violet-300 font-mono tabular-nums">
                                    {stats.pctBusiness}%
                                </p>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">
                                    Iniciativas Documentadas
                                </span>
                                <p className="text-xl font-black text-gray-800 dark:text-gray-200 font-mono tabular-nums">
                                    {businessBullets.length}
                                </p>
                            </div>
                        </div>

                        {/* Scrollable List of ALL Business Value Initiatives */}
                        <PillarScrollList
                            title="Impactos de Negocio Documentados"
                            items={businessBullets}
                            emptyText="Sin información de valor de negocio aún."
                            accentDotClass="bg-violet-500"
                            accentBadgeClass="bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300"
                            maxHeightClass="max-h-[240px]"
                            onSelectInitiative={onSelectInitiative}
                        />
                    </div>
                </div>

                {/* PILAR 2: EFICIENCIA OPERATIVA + HORAS LIBERADAS (Ámbar) */}
                <div className="xl:col-span-2 bg-white dark:bg-[#1E2630] rounded-xl shadow-sm border border-amber-100 dark:border-amber-900/40 p-5 flex flex-col justify-between hover:shadow-md transition-all">
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg text-amber-600 dark:text-amber-400">
                                    <Zap size={18} />
                                </div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                                    Eficiencia Operativa
                                </h4>
                            </div>
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/40 font-mono tabular-nums">
                                {stats.hasOperational} procesos
                            </span>
                        </div>

                        {/* Top KPI row: Procesos Optimizados + Horas Liberadas / Mes + Áreas Impactadas */}
                        <div className="grid grid-cols-3 gap-2 mb-3.5 p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-100/60 dark:border-amber-900/30">
                            <div>
                                <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 block truncate" title="Procesos Optimizados">
                                    Procesos Opt.
                                </span>
                                <p className="text-xl font-black text-amber-700 dark:text-amber-300 font-mono tabular-nums">
                                    {stats.hasOperational}
                                </p>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 block truncate" title="Horas Liberadas por Mes">
                                    Hrs Liberadas/Mes
                                </span>
                                <p className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono tabular-nums leading-7">
                                    {stats.totalHoursPerMonth > 0
                                        ? `+${stats.totalHoursPerMonth.toLocaleString()} hrs`
                                        : `${stats.hoursImpactedCount} inits`}
                                </p>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 block truncate" title="Áreas Impactadas">
                                    Áreas Impactadas
                                </span>
                                <p className="text-xl font-black text-gray-800 dark:text-gray-200 font-mono tabular-nums">
                                    {stats.operationalAreas.length}
                                </p>
                            </div>
                        </div>

                        {/* Scrollable List of ALL Operational Efficiency & Liberated Hours Initiatives */}
                        <PillarScrollList
                            title="Optimizaciones y Horas Liberadas"
                            items={operationalBullets}
                            emptyText="Sin datos de optimización operativa aún."
                            accentDotClass="bg-amber-500"
                            accentBadgeClass="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300"
                            maxHeightClass="max-h-[240px]"
                            onSelectInitiative={onSelectInitiative}
                        />
                    </div>
                </div>

                {/* PILAR 3: BENEFICIO CUALITATIVO (Rosa) */}
                <div className="xl:col-span-2 bg-white dark:bg-[#1E2630] rounded-xl shadow-sm border border-rose-100 dark:border-rose-900/40 p-5 flex flex-col justify-between hover:shadow-md transition-all">
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-lg text-rose-600 dark:text-rose-400">
                                    <Sparkles size={18} />
                                </div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                                    Beneficio Cualitativo
                                </h4>
                            </div>
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300 border border-rose-200/50 dark:border-rose-800/40 font-mono tabular-nums">
                                {qualitativeCategories.length} categorías
                            </span>
                        </div>

                        {/* Badges / Tags interactivos */}
                        <div className="mb-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                                Categorías Identificadas
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {qualitativeCategories.map((cat, idx) => {
                                    const IconComponent = cat.icon;
                                    const primaryInit = cat.sampleInitiatives[0];
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => primaryInit && onSelectInitiative(primaryInit.id, primaryInit.name)}
                                            className={clsx(
                                                'group relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all active:scale-[0.98] cursor-pointer',
                                                cat.bg,
                                                cat.color
                                            )}
                                            title={`Ver iniciativa ejemplo: ${primaryInit?.name || ''}`}
                                        >
                                            <IconComponent size={12} />
                                            <span>{cat.name}</span>
                                            <span className="px-1.5 py-0.2 rounded-full bg-white/70 dark:bg-black/30 text-[10px] font-bold font-mono tabular-nums">
                                                {cat.count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Scrollable List of ALL Qualitative Benefits */}
                        <PillarScrollList
                            title="Impactos Cualitativos Documentados"
                            items={qualitativeBullets}
                            emptyText="Sin beneficios cualitativos registrados."
                            accentDotClass="bg-rose-500"
                            accentBadgeClass="bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300"
                            maxHeightClass="max-h-[195px]"
                            onSelectInitiative={onSelectInitiative}
                        />
                    </div>
                </div>

                {/* PILAR 4: USUARIOS ALCANZADOS (Esmeralda — 3 columnas en XL) */}
                <div className="xl:col-span-3 bg-white dark:bg-[#1E2630] rounded-xl shadow-sm border border-emerald-100 dark:border-emerald-900/40 p-5 flex flex-col justify-between hover:shadow-md transition-all">
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg text-emerald-600 dark:text-emerald-400">
                                    <UserCheck size={18} />
                                </div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                                    Usuarios Alcanzados
                                </h4>
                            </div>
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40 font-mono tabular-nums">
                                {stats.hasUsers} iniciativas
                            </span>
                        </div>

                        {/* Top KPI row */}
                        <div className="grid grid-cols-2 gap-2 mb-3 p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100/60 dark:border-emerald-900/30">
                            <div>
                                <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">
                                    Usuarios Directos
                                </span>
                                <p className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono tabular-nums">
                                    {stats.totalUsers > 0 ? `+${stats.totalUsers.toLocaleString()}` : `${stats.hasUsers} inits`}
                                </p>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">
                                    Áreas Impactadas
                                </span>
                                <p className="text-xl font-black text-gray-800 dark:text-gray-200 font-mono tabular-nums">
                                    {stats.usersAreas.length}
                                </p>
                            </div>
                        </div>

                        {/* Tags de áreas operativas alcanzadas con opción de expandir todas */}
                        {stats.usersAreas.length > 0 && (
                            <div className="mb-3 flex flex-wrap items-center gap-1">
                                {(showAllAreas ? stats.usersAreas : stats.usersAreas.slice(0, 6)).map((area, i) => (
                                    <span
                                        key={i}
                                        className="text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-md"
                                    >
                                        {area}
                                    </span>
                                ))}
                                {stats.usersAreas.length > 6 && (
                                    <button
                                        onClick={() => setShowAllAreas(prev => !prev)}
                                        className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline px-1.5 py-0.5 cursor-pointer"
                                    >
                                        {showAllAreas ? 'Ver menos' : `+${stats.usersAreas.length - 6} más`}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Scrollable List of ALL Users Reached Initiatives */}
                        <PillarScrollList
                            title="Alcance a Equipos y Usuarios"
                            items={usersBullets}
                            emptyText="Sin datos de usuarios alcanzados aún."
                            accentDotClass="bg-emerald-500"
                            accentBadgeClass="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
                            maxHeightClass="max-h-[210px]"
                            onSelectInitiative={onSelectInitiative}
                        />
                    </div>
                </div>

                {/* PILAR 5: AHORRO ESTIMADO (Verde — 3 columnas en XL) */}
                <div className="md:col-span-2 xl:col-span-3 bg-white dark:bg-[#1E2630] rounded-xl shadow-sm border border-green-100 dark:border-green-900/40 p-5 flex flex-col justify-between hover:shadow-md transition-all">
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg text-green-600 dark:text-green-400">
                                    <DollarSign size={18} />
                                </div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                                    Ahorro Estimado
                                </h4>
                            </div>
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-300 border border-green-200/50 dark:border-green-800/40 font-mono tabular-nums">
                                {stats.savingsQuantifiedCount} con ahorro · {stats.savingsPendingCount} en cuantif.
                            </span>
                        </div>

                        {/* Top KPI row */}
                        <div className="grid grid-cols-2 gap-2 mb-3.5 p-3 bg-green-50/50 dark:bg-green-950/20 rounded-xl border border-green-100/60 dark:border-green-900/30">
                            <div>
                                <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">
                                    Ahorro Directo + Aclaración
                                </span>
                                <div className="flex items-baseline gap-1.5 flex-wrap">
                                    <p
                                        className="text-lg font-black text-green-700 dark:text-green-300 font-mono tabular-nums"
                                        title={stats.formattedSavings}
                                    >
                                        {stats.formattedSavings}
                                    </p>
                                    {stats.savingsSecondaryHighlight && (
                                        <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                                            {stats.savingsSecondaryHighlight}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">
                                    Con Beneficio Documentado
                                </span>
                                <p className="text-xl font-black text-gray-800 dark:text-gray-200 font-mono tabular-nums">
                                    {stats.savingsQuantifiedCount}{' '}
                                    <span className="text-xs text-gray-400 font-normal">
                                        / {stats.totalInits}
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Scrollable List of ALL Estimated Savings Initiatives */}
                        <PillarScrollList
                            title="Ahorros y Optimizaciones Financieras"
                            items={savingsBullets}
                            emptyText="Sin ahorros cuantificados registrados aún."
                            accentDotClass="bg-green-500"
                            accentBadgeClass="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300"
                            maxHeightClass="max-h-[240px]"
                            onSelectInitiative={onSelectInitiative}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};
