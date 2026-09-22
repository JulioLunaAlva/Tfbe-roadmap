import React, { useMemo } from 'react';
import {
    TrendingUp, Zap, Users, Sparkles, UserCheck, DollarSign,
    ExternalLink, Award, CheckCircle2, Clock, FileQuestion,
    ShieldCheck, Database, Scale, Cpu, Eye, Gauge, FileSpreadsheet
} from 'lucide-react';
import { clsx } from 'clsx';
import { isNAPillar, isPillarFilled } from '../../utils/exportValue';

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
    onExportConsolidated?: () => void;
}

// ─── Helpers para parsear contenido HTML ──────────────────────────────────────────

const stripHtml = (html?: string): string => {
    if (!html) return '';
    return html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/li>/gi, '\n')
        .replace(/<br\s*[\/]?>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim();
};

interface ExtractedBullet {
    id: string;
    text: string;
    initiative: InitiativeSummaryItem;
    highlight?: string;
}

const extractBulletsFromPillar = (
    initiatives: InitiativeSummaryItem[],
    allValues: Record<string, ValueRecord>,
    pillarKey: keyof ValueRecord,
    maxItems = 4
): ExtractedBullet[] => {
    const bullets: ExtractedBullet[] = [];

    for (const init of initiatives) {
        const val = allValues[init.id]?.[pillarKey];
        if (!val || val === '<p></p>' || isNAPillar(val)) continue;

        const clean = stripHtml(val);
        if (!clean || isNAPillar(clean)) continue;

        const lines = clean
            .split('\n')
            .map(l => l.replace(/^[•\-\*–—\d\.\)]\s*/, '').trim())
            .filter(l => l.length > 5 && !isNAPillar(l));

        for (let i = 0; i < lines.length && i < 2; i++) {
            bullets.push({
                id: `${init.id}-${pillarKey}-${i}`,
                text: lines[i],
                initiative: init
            });
            if (bullets.length >= maxItems) break;
        }
        if (bullets.length >= maxItems) break;
    }

    return bullets;
};

// Extractor de números FTE
const extractTotalFte = (
    initiatives: InitiativeSummaryItem[],
    allValues: Record<string, ValueRecord>
): { totalFte: number; impactedCount: number } => {
    let totalFte = 0;
    let impactedCount = 0;

    for (const init of initiatives) {
        const val = allValues[init.id]?.fte_detail;
        if (!val || val === '<p></p>' || isNAPillar(val)) continue;

        const clean = stripHtml(val);
        if (!clean || isNAPillar(clean)) continue;

        // Buscar números cerca de FTE, personas, posiciones, etc.
        const fteMatch = clean.match(/(?:^|\s)([0-9]+(?:\.[0-9]+)?)\s*(?:FTE|ftes?|posicion(?:es)?|recurso(?:s)?|persona(?:s)?)/i)
            || clean.match(/(?:liberaci[oó]n|ahorro|impacto|reasignaci[oó]n)\s*(?:de)?\s*([0-9]+(?:\.[0-9]+)?)/i);

        if (fteMatch) {
            const num = parseFloat(fteMatch[1]);
            if (!isNaN(num) && num > 0 && num < 1000) {
                totalFte += num;
                impactedCount++;
                continue;
            }
        }

        // Si no se encontró número específico pero hay texto sustancial (que no sea N/A), se cuenta como impacto cualitativo
        if (clean.length > 10 && !isNAPillar(clean)) {
            impactedCount++;
        }
    }

    return { totalFte: Math.round(totalFte * 10) / 10, impactedCount };
};

// Extractor de Ahorros Financieros
const extractSavings = (
    initiatives: InitiativeSummaryItem[],
    allValues: Record<string, ValueRecord>
): { totalSavings: number; quantifiedCount: number } => {
    let totalSavings = 0;
    let quantifiedCount = 0;

    for (const init of initiatives) {
        const val = allValues[init.id]?.estimated_savings_detail;
        if (!val || val === '<p></p>' || isNAPillar(val)) continue;

        const clean = stripHtml(val);
        if (!clean || isNAPillar(clean)) continue;

        // Buscar expresiones de dinero: $100,000 o 100k o 1.5M
        const moneyMatch = clean.match(/\$\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)\s*(k|m|mdp|mil|millones)?/i)
            || clean.match(/([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)\s*(?:USD|MXN)/i);

        if (moneyMatch) {
            let amountStr = moneyMatch[1].replace(/,/g, '');
            let amount = parseFloat(amountStr);
            const multiplier = (moneyMatch[2] || '').toLowerCase();

            if (multiplier === 'k' || multiplier === 'mil') amount *= 1000;
            else if (multiplier === 'm' || multiplier === 'millones' || multiplier === 'mdp') amount *= 1000000;

            if (!isNaN(amount) && amount > 0) {
                totalSavings += amount;
                quantifiedCount++;
                continue;
            }
        }

        if (clean.length > 10 && !isNAPillar(clean)) {
            quantifiedCount++;
        }
    }

    return { totalSavings, quantifiedCount };
};

// Extractor de Usuarios Alcanzados
const extractUsersReached = (
    initiatives: InitiativeSummaryItem[],
    allValues: Record<string, ValueRecord>
): { totalUsers: number; areasImpacted: string[] } => {
    let totalUsers = 0;
    const areas = new Set<string>();

    for (const init of initiatives) {
        const val = allValues[init.id]?.users_reached_detail;
        if (!val || val === '<p></p>' || isNAPillar(val)) continue;

        const clean = stripHtml(val);
        if (!clean || isNAPillar(clean)) continue;

        if (init.area) areas.add(init.area);

        // Buscar cantidades de usuarios
        const userMatch = clean.match(/(?:^|\s|\+|>)([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+)\s*(?:usuarios?|personas?|colaboradores?|empleados?)/i);
        if (userMatch) {
            const num = parseInt(userMatch[1].replace(/,/g, ''), 10);
            if (!isNaN(num) && num > 0 && num < 100000) {
                totalUsers += num;
            }
        }
    }

    return { totalUsers, areasImpacted: Array.from(areas) };
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
            if (!raw || isNAPillar(raw)) continue;
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

    // Si no se encontraron con keywords específicas, agregar tags por defecto basados en iniciativas con datos
    if (results.length === 0) {
        const initsWithQual = initiatives.filter(i => {
            const v = allValues[i.id]?.qualitative_benefit;
            return v && !isNAPillar(v) && isPillarFilled(v);
        });
        if (initsWithQual.length > 0) {
            results.push(
                { name: 'Eficiencia y Calidad', count: initsWithQual.length, icon: Sparkles, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800/40', sampleInitiatives: initsWithQual },
                { name: 'Gobernanza & Cumplimiento', count: Math.ceil(initsWithQual.length / 2), icon: ShieldCheck, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800/40', sampleInitiatives: initsWithQual }
            );
        }
    }

    return results;
};

// ─── Componente de Inspección Hover-to-Reveal ────────────────────────────────────

const InteractiveBullet: React.FC<{
    bullet: ExtractedBullet;
    onClick: () => void;
}> = ({ bullet, onClick }) => {
    return (
        <div
            onClick={onClick}
            className="group relative cursor-pointer p-2 rounded-lg hover:bg-gray-100/70 dark:hover:bg-gray-800/60 transition-all duration-200 text-xs text-gray-700 dark:text-gray-300 flex items-start gap-2 border border-transparent hover:border-gray-200 dark:hover:border-gray-700/60"
        >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
            <div className="flex-1 min-w-0 pr-5">
                <p className="line-clamp-2 leading-relaxed">{bullet.text}</p>
            </div>

            {/* Subtle external jump icon on hover */}
            <ExternalLink
                size={13}
                className="opacity-0 group-hover:opacity-100 text-indigo-500 dark:text-indigo-400 transition-opacity absolute right-2.5 top-2.5 flex-shrink-0"
            />

            {/* Contextual Popover Tooltip */}
            <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900/95 dark:bg-black/95 text-white text-xs rounded-xl shadow-2xl border border-gray-700/60 backdrop-blur-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 transform translate-y-1 group-hover:translate-y-0">
                <p className="font-bold text-indigo-300 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Award size={11} />
                    Proveniente de Iniciativa:
                </p>
                <p className="font-bold text-white text-xs mb-1.5 line-clamp-2 leading-snug">
                    {bullet.initiative.name}
                </p>
                <div className="space-y-0.5 text-[10px] text-gray-300 border-t border-gray-800 pt-1.5">
                    <div><span className="text-gray-400">Área:</span> {bullet.initiative.area || 'General'}</div>
                    <div><span className="text-gray-400">Responsable:</span> {bullet.initiative.transformation_lead || 'N/A'}</div>
                    {bullet.initiative.status && (
                        <div><span className="text-gray-400">Estatus:</span> {bullet.initiative.status}</div>
                    )}
                </div>
                <div className="mt-2 text-[10px] text-indigo-400 font-semibold flex items-center justify-end gap-1">
                    <span>Clic para editar iniciativa</span>
                    <ExternalLink size={10} />
                </div>
            </div>
        </div>
    );
};

// ─── Componente Principal ────────────────────────────────────────────────────────

export const ConsolidatedValueDashboard: React.FC<ConsolidatedValueDashboardProps> = ({
    initiatives,
    allValues,
    pillarSummary,
    onSelectInitiative,
    onExportConsolidated
}) => {
    // Totales y estadísticas del portafolio
    const totalInitiatives = initiatives.length;

    // Métricas por pilar
    const metrics = useMemo(() => {
        let hasBusinessValue = 0;
        let hasOperationalEfficiency = 0;
        let hasFte = 0;
        let hasQualitative = 0;
        let hasUsers = 0;
        let hasSavings = 0;

        for (const init of initiatives) {
            const v = allValues[init.id];
            if (!v) continue;
            if (isPillarFilled(v.business_value) && !isNAPillar(v.business_value)) hasBusinessValue++;
            if (isPillarFilled(v.operational_efficiency) && !isNAPillar(v.operational_efficiency)) hasOperationalEfficiency++;
            if (isPillarFilled(v.fte_detail) && !isNAPillar(v.fte_detail)) hasFte++;
            if (isPillarFilled(v.qualitative_benefit) && !isNAPillar(v.qualitative_benefit)) hasQualitative++;
            if (isPillarFilled(v.users_reached_detail) && !isNAPillar(v.users_reached_detail)) hasUsers++;
            if (isPillarFilled(v.estimated_savings_detail) && !isNAPillar(v.estimated_savings_detail)) hasSavings++;
        }

        // Cálculo de avance global (6/6 pilares):
        // Un pilar marcado como "N/A", "NA" o "No Aplica" cuenta como completado / documentado
        const getInitDocCount = (initId: string): number => {
            const v = allValues[initId];
            if (!v) return pillarSummary[initId] ?? 0;
            let count = 0;
            if (isPillarFilled(v.business_value)) count++;
            if (isPillarFilled(v.operational_efficiency)) count++;
            if (isPillarFilled(v.fte_detail)) count++;
            if (isPillarFilled(v.qualitative_benefit)) count++;
            if (isPillarFilled(v.users_reached_detail)) count++;
            if (isPillarFilled(v.estimated_savings_detail)) count++;
            return count;
        };

        const complete = initiatives.filter(i => getInitDocCount(i.id) === 6).length;
        const partial = initiatives.filter(i => {
            const c = getInitDocCount(i.id);
            return c > 0 && c < 6;
        }).length;
        const empty = totalInitiatives - complete - partial;

        return {
            hasBusinessValue,
            hasOperationalEfficiency,
            hasFte,
            hasQualitative,
            hasUsers,
            hasSavings,
            complete,
            partial,
            empty,
            pctComplete: totalInitiatives > 0 ? Math.round((complete / totalInitiatives) * 100) : 0,
        };
    }, [initiatives, allValues, pillarSummary, totalInitiatives]);

    // Extracción de datos específicos
    const businessBullets = useMemo(() => extractBulletsFromPillar(initiatives, allValues, 'business_value', 3), [initiatives, allValues]);
    const operationalBullets = useMemo(() => extractBulletsFromPillar(initiatives, allValues, 'operational_efficiency', 3), [initiatives, allValues]);
    const fteBullets = useMemo(() => extractBulletsFromPillar(initiatives, allValues, 'fte_detail', 3), [initiatives, allValues]);
    const qualitativeBullets = useMemo(() => extractBulletsFromPillar(initiatives, allValues, 'qualitative_benefit', 2), [initiatives, allValues]);
    const usersBullets = useMemo(() => extractBulletsFromPillar(initiatives, allValues, 'users_reached_detail', 2), [initiatives, allValues]);
    const savingsBullets = useMemo(() => extractBulletsFromPillar(initiatives, allValues, 'estimated_savings_detail', 3), [initiatives, allValues]);

    const { totalFte, impactedCount: fteInitiativesCount } = useMemo(() => extractTotalFte(initiatives, allValues), [initiatives, allValues]);
    const { totalSavings, quantifiedCount: savingsInitiativesCount } = useMemo(() => extractSavings(initiatives, allValues), [initiatives, allValues]);
    const { totalUsers, areasImpacted } = useMemo(() => extractUsersReached(initiatives, allValues), [initiatives, allValues]);
    const qualitativeCategories = useMemo(() => detectQualitativeCategories(initiatives, allValues), [initiatives, allValues]);

    // Helper de moneda
    const formattedSavings = useMemo(() => {
        if (totalSavings === 0) return '$0 USD';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(totalSavings);
    }, [totalSavings]);

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
                        Consolidado analítico de los 6 pilares estratégicos en <span className="font-semibold text-gray-700 dark:text-gray-200">{totalInitiatives} iniciativas</span>. Pasa el cursor sobre cualquier dato para inspeccionar su iniciativa de origen.
                    </p>
                </div>

                {/* Contadores horizontales alineados a la derecha + Botón de Exportación */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Completas */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                        <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        <div>
                            <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300">{metrics.complete}</span>
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 ml-1 font-medium">Completas</span>
                        </div>
                    </div>

                    {/* En Progreso */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
                        <Clock size={15} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
                        <div>
                            <span className="text-xs font-extrabold text-amber-700 dark:text-amber-300">{metrics.partial}</span>
                            <span className="text-[11px] text-amber-600 dark:text-amber-400 ml-1 font-medium">En Progreso</span>
                        </div>
                    </div>

                    {/* Sin Documentar */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/60">
                        <FileQuestion size={15} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
                        <div>
                            <span className="text-xs font-extrabold text-gray-700 dark:text-gray-300">{metrics.empty}</span>
                            <span className="text-[11px] text-gray-500 dark:text-gray-400 ml-1 font-medium">Sin Documentar</span>
                        </div>
                    </div>

                    {/* Barra de progreso */}
                    <div className="w-28 pl-1">
                        <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-1">
                            <span>Avance</span>
                            <span className="text-indigo-600 dark:text-indigo-400">{metrics.pctComplete}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                                style={{ width: `${metrics.pctComplete}%` }}
                            />
                        </div>
                    </div>

                    {/* Botón de Exportación a Excel */}
                    {onExportConsolidated && (
                        <button
                            onClick={onExportConsolidated}
                            className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm hover:shadow transition-all text-xs font-bold whitespace-nowrap active:scale-95 ml-1"
                            title="Exportar Consolidado Completo a Excel"
                        >
                            <FileSpreadsheet size={15} />
                            <span>Exportar Consolidado (Excel)</span>
                        </button>
                    )}
                </div>
            </div>

            {/* ─── 2. Grid Consolidado (2 filas × 3 columnas) ─────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

                {/* PILAR 1: VALOR DE NEGOCIO (Púrpura) */}
                <div className="bg-white dark:bg-[#1E2630] rounded-xl shadow-sm border border-violet-100 dark:border-violet-900/40 p-5 flex flex-col justify-between hover:shadow-md transition-all">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-violet-100 dark:bg-violet-900/50 rounded-lg text-violet-600 dark:text-violet-400">
                                    <TrendingUp size={18} />
                                </div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                                    Valor de Negocio
                                </h4>
                            </div>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 border border-violet-200/50 dark:border-violet-800/40">
                                {metrics.hasBusinessValue} de {totalInitiatives}
                            </span>
                        </div>

                        {/* Top KPI row */}
                        <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-violet-50/50 dark:bg-violet-950/20 rounded-xl border border-violet-100/60 dark:border-violet-900/30">
                            <div>
                                <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">Alineación</span>
                                <p className="text-xl font-black text-violet-700 dark:text-violet-300">
                                    {totalInitiatives > 0 ? Math.round((metrics.hasBusinessValue / totalInitiatives) * 100) : 0}%
                                </p>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">Ejes Clave</span>
                                <p className="text-xl font-black text-gray-800 dark:text-gray-200">
                                    {businessBullets.length > 0 ? `${businessBullets.length}+` : '0'}
                                </p>
                            </div>
                        </div>

                        {/* Bullets con Hover-to-reveal */}
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Ejes Principales Documentados</p>
                            {businessBullets.length > 0 ? (
                                businessBullets.map(bullet => (
                                    <InteractiveBullet
                                        key={bullet.id}
                                        bullet={bullet}
                                        onClick={() => onSelectInitiative(bullet.initiative.id, bullet.initiative.name)}
                                    />
                                ))
                            ) : (
                                <p className="text-xs text-gray-400 italic py-2">Sin información de valor de negocio aún.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* PILAR 2: EFICIENCIA OPERATIVA (Naranja) */}
                <div className="bg-white dark:bg-[#1E2630] rounded-xl shadow-sm border border-amber-100 dark:border-amber-900/40 p-5 flex flex-col justify-between hover:shadow-md transition-all">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg text-amber-600 dark:text-amber-400">
                                    <Zap size={18} />
                                </div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                                    Eficiencia Operativa
                                </h4>
                            </div>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/40">
                                {metrics.hasOperationalEfficiency} procesos
                            </span>
                        </div>

                        {/* Top KPI row */}
                        <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-100/60 dark:border-amber-900/30">
                            <div>
                                <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">Procesos Optimizados</span>
                                <p className="text-xl font-black text-amber-700 dark:text-amber-300">
                                    {metrics.hasOperationalEfficiency}
                                </p>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">Áreas Impactadas</span>
                                <p className="text-xl font-black text-gray-800 dark:text-gray-200">
                                    {areasImpacted.length || 0}
                                </p>
                            </div>
                        </div>

                        {/* Bullets con Hover-to-reveal */}
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Optimizaciones Destacadas</p>
                            {operationalBullets.length > 0 ? (
                                operationalBullets.map(bullet => (
                                    <InteractiveBullet
                                        key={bullet.id}
                                        bullet={bullet}
                                        onClick={() => onSelectInitiative(bullet.initiative.id, bullet.initiative.name)}
                                    />
                                ))
                            ) : (
                                <p className="text-xs text-gray-400 italic py-2">Sin datos de optimización operativa aún.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* PILAR 3: FTE (Azul) */}
                <div className="bg-white dark:bg-[#1E2630] rounded-xl shadow-sm border border-cyan-100 dark:border-cyan-900/40 p-5 flex flex-col justify-between hover:shadow-md transition-all">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-cyan-100 dark:bg-cyan-900/50 rounded-lg text-cyan-600 dark:text-cyan-400">
                                    <Users size={18} />
                                </div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                                    Impacto en FTE
                                </h4>
                            </div>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-300 border border-cyan-200/50 dark:border-cyan-800/40">
                                {fteInitiativesCount} iniciativas
                            </span>
                        </div>

                        {/* Top KPI row */}
                        <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-cyan-50/50 dark:bg-cyan-950/20 rounded-xl border border-cyan-100/60 dark:border-cyan-900/30">
                            <div>
                                <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">FTEs Liberados</span>
                                <p className="text-xl font-black text-cyan-700 dark:text-cyan-300">
                                    {totalFte > 0 ? `${totalFte}` : `${fteInitiativesCount} inits`}
                                </p>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">% Carga Optimizada</span>
                                <p className="text-xl font-black text-gray-800 dark:text-gray-200">
                                    {totalInitiatives > 0 ? Math.round((fteInitiativesCount / totalInitiatives) * 100) : 0}%
                                </p>
                            </div>
                        </div>

                        {/* Bullets con Hover-to-reveal */}
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Capacidad Reasignada o Liberada</p>
                            {fteBullets.length > 0 ? (
                                fteBullets.map(bullet => (
                                    <InteractiveBullet
                                        key={bullet.id}
                                        bullet={bullet}
                                        onClick={() => onSelectInitiative(bullet.initiative.id, bullet.initiative.name)}
                                    />
                                ))
                            ) : (
                                <p className="text-xs text-gray-400 italic py-2">Sin registro de FTEs liberados aún.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* PILAR 4: BENEFICIO CUALITATIVO (Rojo/Rosa) */}
                <div className="bg-white dark:bg-[#1E2630] rounded-xl shadow-sm border border-rose-100 dark:border-rose-900/40 p-5 flex flex-col justify-between hover:shadow-md transition-all">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-lg text-rose-600 dark:text-rose-400">
                                    <Sparkles size={18} />
                                </div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                                    Beneficio Cualitativo
                                </h4>
                            </div>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300 border border-rose-200/50 dark:border-rose-800/40">
                                {qualitativeCategories.length} categorías
                            </span>
                        </div>

                        {/* Badges / Tags interactivos */}
                        <div className="mb-4">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Categorías Identificadas</p>
                            <div className="flex flex-wrap gap-1.5">
                                {qualitativeCategories.map((cat, idx) => {
                                    const IconComponent = cat.icon;
                                    const primaryInit = cat.sampleInitiatives[0];
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => primaryInit && onSelectInitiative(primaryInit.id, primaryInit.name)}
                                            className={clsx(
                                                'group relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all hover:scale-[1.02] cursor-pointer',
                                                cat.bg,
                                                cat.color
                                            )}
                                            title={`Ver iniciativa: ${primaryInit?.name || ''}`}
                                        >
                                            <IconComponent size={12} />
                                            <span>{cat.name}</span>
                                            <span className="px-1.5 py-0.2 rounded-full bg-white/70 dark:bg-black/30 text-[10px] font-bold">
                                                {cat.count}
                                            </span>
                                            <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 ml-0.5 transition-opacity" />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Bullets con Hover-to-reveal */}
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Impactos Cualitativos Destacados</p>
                            {qualitativeBullets.length > 0 ? (
                                qualitativeBullets.map(bullet => (
                                    <InteractiveBullet
                                        key={bullet.id}
                                        bullet={bullet}
                                        onClick={() => onSelectInitiative(bullet.initiative.id, bullet.initiative.name)}
                                    />
                                ))
                            ) : (
                                <p className="text-xs text-gray-400 italic py-2">Sin beneficios cualitativos registrados.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* PILAR 5: USUARIOS ALCANZADOS (Cian / Esmeralda) */}
                <div className="bg-white dark:bg-[#1E2630] rounded-xl shadow-sm border border-emerald-100 dark:border-emerald-900/40 p-5 flex flex-col justify-between hover:shadow-md transition-all">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg text-emerald-600 dark:text-emerald-400">
                                    <UserCheck size={18} />
                                </div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                                    Usuarios Alcanzados
                                </h4>
                            </div>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40">
                                {metrics.hasUsers} inits
                            </span>
                        </div>

                        {/* Top KPI row */}
                        <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100/60 dark:border-emerald-900/30">
                            <div>
                                <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">Usuarios Estimados</span>
                                <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                                    {totalUsers > 0 ? `+${totalUsers.toLocaleString()}` : `${metrics.hasUsers} inits`}
                                </p>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">Áreas Impactadas</span>
                                <p className="text-xl font-black text-gray-800 dark:text-gray-200">
                                    {areasImpacted.length}
                                </p>
                            </div>
                        </div>

                        {/* Tags de áreas operativas alcanzadas */}
                        {areasImpacted.length > 0 && (
                            <div className="mb-3 flex flex-wrap gap-1">
                                {areasImpacted.slice(0, 4).map((area, i) => (
                                    <span key={i} className="text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-md">
                                        {area}
                                    </span>
                                ))}
                                {areasImpacted.length > 4 && (
                                    <span className="text-[10px] text-gray-400">+{areasImpacted.length - 4} más</span>
                                )}
                            </div>
                        )}

                        {/* Bullets con Hover-to-reveal */}
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Alcance a Equipos y Usuarios</p>
                            {usersBullets.length > 0 ? (
                                usersBullets.map(bullet => (
                                    <InteractiveBullet
                                        key={bullet.id}
                                        bullet={bullet}
                                        onClick={() => onSelectInitiative(bullet.initiative.id, bullet.initiative.name)}
                                    />
                                ))
                            ) : (
                                <p className="text-xs text-gray-400 italic py-2">Sin datos de usuarios alcanzados aún.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* PILAR 6: AHORRO ESTIMADO (Verde) */}
                <div className="bg-white dark:bg-[#1E2630] rounded-xl shadow-sm border border-green-100 dark:border-green-900/40 p-5 flex flex-col justify-between hover:shadow-md transition-all">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg text-green-600 dark:text-green-400">
                                    <DollarSign size={18} />
                                </div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                                    Ahorro Estimado
                                </h4>
                            </div>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-300 border border-green-200/50 dark:border-green-800/40">
                                {savingsInitiativesCount} con ahorro
                            </span>
                        </div>

                        {/* Top KPI row */}
                        <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-green-50/50 dark:bg-green-950/20 rounded-xl border border-green-100/60 dark:border-green-900/30">
                            <div>
                                <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">Ahorro Acumulado</span>
                                <p className="text-xl font-black text-green-700 dark:text-green-300 truncate" title={formattedSavings}>
                                    {formattedSavings}
                                </p>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">Iniciativas Cuantificadas</span>
                                <p className="text-xl font-black text-gray-800 dark:text-gray-200">
                                    {savingsInitiativesCount} <span className="text-xs text-gray-400 font-normal">/ {totalInitiatives}</span>
                                </p>
                            </div>
                        </div>

                        {/* Bullets con Hover-to-reveal */}
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Ahorros Financieros Registrados</p>
                            {savingsBullets.length > 0 ? (
                                savingsBullets.map(bullet => (
                                    <InteractiveBullet
                                        key={bullet.id}
                                        bullet={bullet}
                                        onClick={() => onSelectInitiative(bullet.initiative.id, bullet.initiative.name)}
                                    />
                                ))
                            ) : (
                                <p className="text-xs text-gray-400 italic py-2">Sin ahorros cuantificados registrados aún.</p>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
