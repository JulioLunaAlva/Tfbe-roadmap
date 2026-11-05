import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    X, Award, MapPin, User, Rocket, ChevronLeft, ChevronRight,
    LayoutGrid, Sparkles, CheckCircle2, Clock, MinusCircle,
    FileText, FileSpreadsheet, Cpu, ChevronDown, ArrowUpRight,
    Layers, ShieldCheck, Check
} from 'lucide-react';
import { clsx } from 'clsx';
import {
    stripHtml,
    isNAPillar,
    isPillarFilled,
    isPillarCompleted,
    isPendingDocumentation,
    isUnquantifiedPillarText
} from '../../utils/exportValue';

export interface ValueData {
    business_value: string;
    operational_efficiency: string;
    fte_detail: string;
    qualitative_benefit: string;
    users_reached_detail: string;
    estimated_savings_detail: string;
}

export interface PillarConfig {
    key: keyof ValueData;
    label: string;
    icon: any;
    gradient: string;
    iconBg: string;
    iconColor: string;
}

export interface PresentationInitiativeItem {
    id: string;
    name: string;
    area: string;
    champion?: string;
    transformation_lead?: string;
    status?: string;
    progress?: number;
    technologies?: string[];
}

interface PresentationModalProps {
    isOpen: boolean;
    onClose: () => void;
    initiative: PresentationInitiativeItem;
    data: ValueData;
    pillars: PillarConfig[];
    allInitiatives?: PresentationInitiativeItem[];
    allValues?: Record<string, ValueData>;
    onSelectInitiative?: (id: string, name: string) => void;
    onExportPDF?: () => void;
    onExportExcel?: () => void;
}

// ─── Craft UI Spotlight Card ─────────────────────────────────────────────────────

const SpotlightCard: React.FC<{
    children: React.ReactNode;
    className?: string;
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
    glowColor?: string;
}> = ({ children, className = '', onClick, glowColor = 'rgba(255,255,255,0.06)' }) => {
    const divRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!divRef.current) return;
        const rect = divRef.current.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    return (
        <div
            ref={divRef}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setOpacity(1)}
            onMouseLeave={() => setOpacity(0)}
            className={clsx(
                'relative overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/50 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]',
                className
            )}
        >
            <div
                className="pointer-events-none absolute -inset-px transition-opacity duration-300"
                style={{
                    opacity,
                    background: `radial-gradient(520px circle at ${position.x}px ${position.y}px, ${glowColor}, transparent 45%)`,
                }}
            />
            {children}
        </div>
    );
};

// ─── Analytical Helpers for Presentation Slides ──────────────────────────────────

const PILLAR_THEME: Record<
    keyof ValueData,
    {
        code: string;
        shortName: string;
        dimension: string;
        description: string;
        accentText: string;
        accentBg: string;
        accentBorder: string;
        dotColor: string;
        glowRgba: string;
    }
> = {
    business_value: {
        code: '01',
        shortName: 'Negocio',
        dimension: 'Alineación Estratégica & Flujo Protegido',
        description: 'Impacto en objetivos financieros, continuidad operativa, cobranza e ingresos del negocio.',
        accentText: 'text-violet-400',
        accentBg: 'bg-violet-500/10',
        accentBorder: 'border-violet-500/25',
        dotColor: 'bg-violet-400',
        glowRgba: 'rgba(139, 92, 246, 0.12)',
    },
    operational_efficiency: {
        code: '02',
        shortName: 'Eficiencia',
        dimension: 'Optimización de Procesos & Tiempos de Ciclo',
        description: 'Reducción de tiempos de ejecución, eliminación de tareas manuales y estandarización operativa.',
        accentText: 'text-amber-400',
        accentBg: 'bg-amber-500/10',
        accentBorder: 'border-amber-500/25',
        dotColor: 'bg-amber-400',
        glowRgba: 'rgba(245, 158, 11, 0.12)',
    },
    fte_detail: {
        code: '03',
        shortName: 'Impacto FTE',
        dimension: 'Capacidad Operativa & Horas-Hombre',
        description: 'Liberación o reasignación de talento y tiempo operativo hacia actividades analíticas de valor.',
        accentText: 'text-cyan-400',
        accentBg: 'bg-cyan-500/10',
        accentBorder: 'border-cyan-500/25',
        dotColor: 'bg-cyan-400',
        glowRgba: 'rgba(6, 182, 212, 0.12)',
    },
    qualitative_benefit: {
        code: '04',
        shortName: 'Cualitativo',
        dimension: 'Gobernanza, Mitigación de Riesgo & Calidad',
        description: 'Beneficios intangibles en control interno, cumplimiento normativo/SOX, trazabilidad y certidumbre.',
        accentText: 'text-rose-400',
        accentBg: 'bg-rose-500/10',
        accentBorder: 'border-rose-500/25',
        dotColor: 'bg-rose-400',
        glowRgba: 'rgba(244, 63, 94, 0.12)',
    },
    users_reached_detail: {
        code: '05',
        shortName: 'Usuarios',
        dimension: 'Alcance Organizacional & Adopción',
        description: 'Equipos, especialistas, áreas financieras y geografías beneficiadas por la iniciativa.',
        accentText: 'text-emerald-400',
        accentBg: 'bg-emerald-500/10',
        accentBorder: 'border-emerald-500/25',
        dotColor: 'bg-emerald-400',
        glowRgba: 'rgba(16, 185, 129, 0.12)',
    },
    estimated_savings_detail: {
        code: '06',
        shortName: 'Ahorro',
        dimension: 'Impacto Económico & Optimización de Costos',
        description: 'Ahorro financiero directo, recuperación en aclaraciones comerciales y eficiencia en recursos.',
        accentText: 'text-green-400',
        accentBg: 'bg-green-500/10',
        accentBorder: 'border-green-500/25',
        dotColor: 'bg-green-400',
        glowRgba: 'rgba(34, 197, 94, 0.12)',
    },
};

function extractPillarBullets(raw?: string): string[] {
    if (!raw) return [];
    const clean = stripHtml(raw);
    if (!clean) return [];
    return clean
        .split('\n')
        .map(l => l.replace(/^[•\-\*–—\s]+/, '').trim())
        .filter(l => l.length > 0);
}

function extractKeyMetricFromText(raw?: string): string | null {
    if (!raw || isNAPillar(raw) || isPendingDocumentation(raw) || isUnquantifiedPillarText(raw)) {
        return null;
    }
    const clean = stripHtml(raw);
    const patterns = [
        /\$\s*[0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?\s*(?:USD|MXN|MDP|MMUSD)?/i,
        /[0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?\s*(?:MM\s*USD|MMUSD|MDP|millones\s+de\s+pesos|USD)/i,
        /[0-9]+(?:\.[0-9]+)?\s*(?:hrs?|horas?)\s*\/\s*(?:semana|mes|a[ñn]o|semestralmente)/i,
        /(?:entre\s+[0-9]+\s+y\s+)?[0-9]+(?:\.[0-9]+)?\s*(?:hrs?|horas?)\s*(?:semanales|mensuales|anuales|hombre\s+anuales)/i,
        /de\s+[0-9]+\s*(?:horas?|hrs?|minutos?|min)\s+a\s+[0-9]+\s*(?:minutos?|min|segundos?|seg)/i,
        /[0-9]+(?:\.[0-9]+)?\s*FTEs?\b/i,
        /un\s+solo\s+FTE/i,
        /[0-9]+\s*x\b/i,
        /[0-9]{1,3}(?:,[0-9]{3})*\s*(?:usuarios?|usurarios?|personas?|colaboradores?|oficiales?|oficilaes?|pa[ií]ses)/i,
        /[0-9]+(?:\.[0-9]+)?%\s*(?:en\s+dso|dso|de\s+reducci[oó]n|de\s+ahorro|de\s+mejora)?/i,
        /[0-9]+\s*(?:minutos?|min)\s*por\s*ejecuci[oó]n/i,
    ];

    for (const regex of patterns) {
        const match = clean.match(regex);
        if (match) {
            return match[0]
                .replace(/usurarios/i, 'usuarios')
                .replace(/oficilaes/i, 'oficiales')
                .replace(/un solo fte/i, '1 FTE')
                .trim();
        }
    }
    return null;
}

function detectPillarTags(raw?: string): string[] {
    if (!raw || isNAPillar(raw) || isPendingDocumentation(raw)) return [];
    const text = stripHtml(raw).toLowerCase();
    const rules = [
        { label: 'Mitigación de Riesgo', kw: ['riesgo', 'mitiga', 'auditor', 'contingencia'] },
        { label: 'Calidad de Datos', kw: ['calidad', 'consisten', 'integridad', 'homolog'] },
        { label: 'Cumplimiento & SOX', kw: ['cumplimiento', 'sox', 'fiscal', 'normativ', 'sat', 'legal'] },
        { label: 'Automatización & IA', kw: ['automatiz', 'rpa', 'agente', 'bot', 'ia', 'lenguaje natural'] },
        { label: 'Trazabilidad & Control', kw: ['trazabil', 'control', 'visibilidad', 'gobernanza', 'tablero'] },
        { label: 'Ahorro de Tiempo', kw: ['tiempo', 'horas', 'hrs', 'minutos', 'agil', 'ciclo'] },
        { label: 'Impacto en Cobranza / Flujo', kw: ['cobranza', 'flujo', 'dso', 'liquidez', 'caja', 'facturaci'] },
    ];
    return rules.filter(r => r.kw.some(k => text.includes(k))).map(r => r.label).slice(0, 4);
}

function getPillarStatusInfo(raw?: string): {
    label: string;
    code: 'documented' | 'unquantified' | 'na' | 'pending_mgmt' | 'empty';
    badgeClass: string;
    icon: any;
} {
    if (!isPillarFilled(raw)) {
        return {
            label: 'Sin Documentar',
            code: 'empty',
            badgeClass: 'bg-zinc-800/80 text-zinc-400 border-zinc-700/80',
            icon: MinusCircle,
        };
    }
    if (isNAPillar(raw)) {
        return {
            label: 'No Aplica (N/A)',
            code: 'na',
            badgeClass: 'bg-zinc-800/90 text-zinc-300 border-zinc-700',
            icon: MinusCircle,
        };
    }
    if (isPendingDocumentation(raw)) {
        return {
            label: 'Pendiente Gerencia',
            code: 'pending_mgmt',
            badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
            icon: Clock,
        };
    }
    if (isUnquantifiedPillarText(raw)) {
        return {
            label: 'En Cuantificación',
            code: 'unquantified',
            badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
            icon: Clock,
        };
    }
    return {
        label: 'Documentado',
        code: 'documented',
        badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
        icon: CheckCircle2,
    };
}

// ─── Main Component ──────────────────────────────────────────────────────────────

export const ValuePresentationModal = ({
    isOpen,
    onClose,
    initiative,
    data,
    pillars,
    allInitiatives = [],
    allValues = {},
    onSelectInitiative,
    onExportPDF,
    onExportExcel,
}: PresentationModalProps) => {
    // Steps:
    // 0 = Portada Ejecutiva & Hero Telemetry
    // 1 = Panorama 360° (One-Pager Bento Grid of all 6 Pillars)
    // 2..7 = Deep-Dive into Pillar 1..6
    const [step, setStep] = useState(0);
    const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
    const [switcherQuery, setSwitcherQuery] = useState('');
    const totalSlides = pillars.length + 2; // 8 slides (0..7)

    // Keyboard navigation (<-, ->, 1..8, Esc)
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

            if (e.key === 'Escape') {
                if (isSwitcherOpen) {
                    setIsSwitcherOpen(false);
                } else {
                    onClose();
                }
            } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
                e.preventDefault();
                setStep(s => Math.min(s + 1, totalSlides - 1));
            } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
                e.preventDefault();
                setStep(s => Math.max(s - 1, 0));
            } else if (/^[1-8]$/.test(e.key)) {
                const idx = parseInt(e.key, 10) - 1;
                if (idx >= 0 && idx < totalSlides) {
                    e.preventDefault();
                    setStep(idx);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isSwitcherOpen, onClose, totalSlides]);

    // Computed metrics for active initiative
    const pillarAnalytics = useMemo(() => {
        return pillars.map((p, idx) => {
            const raw = data[p.key] || '';
            const bullets = extractPillarBullets(raw);
            const metric = extractKeyMetricFromText(raw);
            const statusInfo = getPillarStatusInfo(raw);
            const tags = detectPillarTags(raw);
            const theme = PILLAR_THEME[p.key];
            return {
                pillar: p,
                index: idx,
                slideIndex: idx + 2, // Slides 2..7
                raw,
                bullets,
                metric,
                statusInfo,
                tags,
                theme,
            };
        });
    }, [pillars, data]);

    const completedPillarsCount = useMemo(
        () => pillars.filter(p => isPillarCompleted(data[p.key])).length,
        [pillars, data]
    );

    const substantivePillarsCount = useMemo(
        () => pillarAnalytics.filter(pa => pa.statusInfo.code === 'documented').length,
        [pillarAnalytics]
    );

    // Current initiative index in allInitiatives for Prev/Next switching
    const currentInitIdx = useMemo(() => {
        if (!initiative.id || allInitiatives.length === 0) return -1;
        return allInitiatives.findIndex(i => i.id === initiative.id);
    }, [allInitiatives, initiative.id]);

    const prevInit = currentInitIdx > 0 ? allInitiatives[currentInitIdx - 1] : null;
    const nextInit =
        currentInitIdx >= 0 && currentInitIdx < allInitiatives.length - 1
            ? allInitiatives[currentInitIdx + 1]
            : null;

    const filteredSwitcherInits = useMemo(() => {
        if (!switcherQuery.trim()) return allInitiatives;
        const q = switcherQuery.toLowerCase();
        return allInitiatives.filter(
            i => i.name.toLowerCase().includes(q) || (i.area && i.area.toLowerCase().includes(q))
        );
    }, [allInitiatives, switcherQuery]);

    if (!isOpen) return null;

    const activePillarAnalysis = step >= 2 && step < totalSlides ? pillarAnalytics[step - 2] : null;

    const getStatusBadgeStyle = (status?: string) => {
        const s = (status || '').toLowerCase();
        if (s.includes('atraso') || s.includes('retrasado')) {
            return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
        }
        if (s.includes('redefinición')) {
            return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
        }
        if (s.includes('entregado')) {
            return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
        }
        if (s.includes('en curso') || s.includes('avance')) {
            return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
        }
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    };

    const modalContent = (
        <div className="fixed inset-0 z-[999999] bg-[#09090b] text-zinc-100 flex flex-col overflow-hidden select-none animate-in fade-in duration-300">
            {/* ─── Craft UI Architectural Background (Micro-Grid + Subtle Radial Mask) ─── */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#ffffff12_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_45%,#000_60%,transparent_100%)]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

            {/* ─── 1. TOP EXECUTIVE BAR (Brand + Live Initiative Switcher + Actions) ─── */}
            <header className="relative z-30 flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 border-b border-white/[0.08] bg-zinc-950/80 backdrop-blur-md shrink-0">
                {/* Left: Brand & Slide Indicator */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2.5 pr-3 border-r border-white/[0.08]">
                        <div className="w-8 h-8 rounded-lg bg-[#E10600] flex items-center justify-center shadow-sm">
                            <Award size={16} className="text-white" />
                        </div>
                        <div>
                            <span className="block text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                                TFBE // 2026
                            </span>
                            <span className="block text-xs font-semibold tracking-tight text-zinc-100">
                                Executive Value Deck
                            </span>
                        </div>
                    </div>

                    <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono tabular-nums bg-zinc-900 border border-zinc-800 text-zinc-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        SLIDE 0{step + 1} / 0{totalSlides}
                    </span>
                </div>

                {/* Center: Live Initiative Switcher (Allows changing initiative without exiting presentation!) */}
                {allInitiatives.length > 0 && onSelectInitiative && (
                    <div className="relative flex items-center gap-1.5">
                        <button
                            onClick={() => prevInit && onSelectInitiative(prevInit.id, prevInit.name)}
                            disabled={!prevInit}
                            title={prevInit ? `Iniciativa anterior: ${prevInit.name}` : 'Primera iniciativa'}
                            className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900/90 text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] transition-all cursor-pointer"
                        >
                            <ChevronLeft size={15} />
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setIsSwitcherOpen(prev => !prev)}
                                className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/90 hover:bg-zinc-800/90 text-left transition-all active:scale-[0.99] cursor-pointer max-w-[260px] sm:max-w-[360px]"
                                title="Cambiar de iniciativa en vivo"
                            >
                                <span className="text-[10px] font-mono text-zinc-400 tabular-nums shrink-0">
                                    {currentInitIdx >= 0 ? `${currentInitIdx + 1}/${allInitiatives.length}` : 'INIT'}
                                </span>
                                <span className="text-xs font-medium text-zinc-100 truncate">
                                    {initiative.name}
                                </span>
                                <ChevronDown
                                    size={13}
                                    className={clsx(
                                        'text-zinc-400 shrink-0 transition-transform',
                                        isSwitcherOpen && 'rotate-180'
                                    )}
                                />
                            </button>

                            {isSwitcherOpen && (
                                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-80 sm:w-96 rounded-xl border border-zinc-800 bg-zinc-950/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50">
                                    <div className="p-2 border-b border-zinc-800/80">
                                        <input
                                            type="text"
                                            value={switcherQuery}
                                            onChange={e => setSwitcherQuery(e.target.value)}
                                            placeholder="Buscar otra iniciativa para presentar..."
                                            className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="max-h-64 overflow-y-auto custom-scrollbar divide-y divide-zinc-900">
                                        {filteredSwitcherInits.map(item => {
                                            const v = allValues[item.id];
                                            const itemCompleted = v
                                                ? pillars.filter(p => isPillarCompleted(v[p.key])).length
                                                : 0;
                                            const isCurrent = item.id === initiative.id;
                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={() => {
                                                        onSelectInitiative(item.id, item.name);
                                                        setIsSwitcherOpen(false);
                                                        setSwitcherQuery('');
                                                    }}
                                                    className={clsx(
                                                        'w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-2 hover:bg-zinc-900/90 transition-colors cursor-pointer',
                                                        isCurrent && 'bg-zinc-900'
                                                    )}
                                                >
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-medium text-zinc-100 truncate flex items-center gap-1.5">
                                                            {isCurrent && <Check size={12} className="text-emerald-400 shrink-0" />}
                                                            <span className="truncate">{item.name}</span>
                                                        </p>
                                                        <p className="text-[10px] text-zinc-500 truncate">
                                                            {item.area || 'General'} · {item.status || 'Sin estatus'}
                                                        </p>
                                                    </div>
                                                    <span
                                                        className={clsx(
                                                            'px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold tabular-nums shrink-0',
                                                            itemCompleted === 6
                                                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                                                                : itemCompleted > 0
                                                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                                                                : 'bg-zinc-800 text-zinc-500'
                                                        )}
                                                    >
                                                        {itemCompleted}/6
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => nextInit && onSelectInitiative(nextInit.id, nextInit.name)}
                            disabled={!nextInit}
                            title={nextInit ? `Siguiente iniciativa: ${nextInit.name}` : 'Última iniciativa'}
                            className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900/90 text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] transition-all cursor-pointer"
                        >
                            <ChevronRight size={15} />
                        </button>
                    </div>
                )}

                {/* Right: Export Quick Buttons + Close */}
                <div className="flex items-center gap-2">
                    {onExportPDF && (
                        <button
                            onClick={onExportPDF}
                            title="Descargar Ficha Ejecutiva en PDF"
                            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-all active:scale-[0.98] cursor-pointer"
                        >
                            <FileText size={13} className="text-rose-400" />
                            <span>PDF</span>
                        </button>
                    )}
                    {onExportExcel && (
                        <button
                            onClick={onExportExcel}
                            title="Descargar Ficha Técnica en Excel"
                            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-all active:scale-[0.98] cursor-pointer"
                        >
                            <FileSpreadsheet size={13} className="text-emerald-400" />
                            <span>Excel</span>
                        </button>
                    )}

                    <button
                        onClick={onClose}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-all active:scale-[0.98] cursor-pointer"
                        title="Salir de la presentación (Esc)"
                    >
                        <span>Salir</span>
                        <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded border border-zinc-700 bg-zinc-950 text-zinc-400">
                            Esc
                        </kbd>
                        <X size={14} />
                    </button>
                </div>
            </header>

            {/* ─── 2. MAIN SLIDE STAGE ─────────────────────────────────────────────────── */}
            <main className="relative z-10 flex-1 min-h-0 overflow-y-auto custom-scrollbar px-6 py-6 md:px-10 md:py-7 flex flex-col justify-center">
                <div className="w-full max-w-7xl mx-auto h-full flex flex-col justify-center">

                    {/* ══════════════════════════════════════════════════════════════════════
                        SLIDE 0: PORTADA EJECUTIVA & TELEMETRÍA BENTO
                       ══════════════════════════════════════════════════════════════════════ */}
                    {step === 0 && (
                        <div className="flex flex-col justify-between gap-6 my-auto animate-in fade-in duration-300">
                            {/* Top Hero Card */}
                            <SpotlightCard className="p-7 md:p-9">
                                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold uppercase tracking-wider bg-[#E10600]/15 text-red-400 border border-[#E10600]/30">
                                            FICHA DE IMPACTO & VALOR
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono uppercase tracking-wider bg-zinc-800/90 text-zinc-300 border border-zinc-700/80">
                                            <MapPin size={12} className="text-zinc-400" />
                                            {initiative.area || 'General'}
                                        </span>
                                        <span
                                            className={clsx(
                                                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold uppercase tracking-wider border',
                                                getStatusBadgeStyle(initiative.status)
                                            )}
                                        >
                                            <Rocket size={12} />
                                            {initiative.status || 'Sin Estatus'}
                                        </span>
                                    </div>

                                    {/* Quick Action to jump to One-Pager 360 */}
                                    <button
                                        onClick={() => setStep(1)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer shadow-sm"
                                    >
                                        <LayoutGrid size={14} />
                                        <span>Ver One-Pager 360°</span>
                                        <ArrowUpRight size={14} />
                                    </button>
                                </div>

                                {/* Initiative Title */}
                                <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-zinc-50 tracking-tight leading-[1.12] mb-6 max-w-5xl">
                                    {initiative.name}
                                </h1>

                                {/* Governance & Metadata Telemetry Row */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-5 border-t border-white/[0.08]">
                                    <div className="p-3 rounded-xl bg-zinc-950/60 border border-white/[0.06]">
                                        <span className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">
                                            Resp. Transformación
                                        </span>
                                        <div className="flex items-center gap-2 text-sm font-medium text-zinc-200 truncate">
                                            <User size={14} className="text-zinc-400 shrink-0" />
                                            <span className="truncate">{initiative.transformation_lead || initiative.champion || 'No asignado'}</span>
                                        </div>
                                    </div>

                                    <div className="p-3 rounded-xl bg-zinc-950/60 border border-white/[0.06]">
                                        <span className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">
                                            Champion / Sponsor
                                        </span>
                                        <div className="flex items-center gap-2 text-sm font-medium text-zinc-200 truncate">
                                            <ShieldCheck size={14} className="text-zinc-400 shrink-0" />
                                            <span className="truncate">{initiative.champion || initiative.transformation_lead || 'No asignado'}</span>
                                        </div>
                                    </div>

                                    <div className="p-3 rounded-xl bg-zinc-950/60 border border-white/[0.06]">
                                        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5">
                                            <span>Avance Roadmap</span>
                                            <span className="text-zinc-200 font-bold tabular-nums">{initiative.progress ?? 0}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                                                style={{ width: `${initiative.progress ?? 0}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="p-3 rounded-xl bg-zinc-950/60 border border-white/[0.06]">
                                        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">
                                            <span>Madurez Documental</span>
                                            <span className="text-emerald-400 font-bold tabular-nums">
                                                {completedPillarsCount}/6 Pilares
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-1.5">
                                            {pillarAnalytics.map((pa, i) => (
                                                <div
                                                    key={i}
                                                    className={clsx(
                                                        'h-2 flex-1 rounded-full transition-colors',
                                                        pa.statusInfo.code === 'documented'
                                                            ? 'bg-emerald-400'
                                                            : pa.statusInfo.code === 'unquantified'
                                                            ? 'bg-cyan-400'
                                                            : pa.statusInfo.code === 'na'
                                                            ? 'bg-zinc-600'
                                                            : pa.statusInfo.code === 'pending_mgmt'
                                                            ? 'bg-amber-400'
                                                            : 'bg-zinc-800'
                                                    )}
                                                    title={`${pa.pillar.label}: ${pa.statusInfo.label}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {initiative.technologies && initiative.technologies.length > 0 && (
                                    <div className="mt-4 flex flex-wrap items-center gap-1.5">
                                        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mr-1 flex items-center gap-1">
                                            <Cpu size={11} /> Tecnologías:
                                        </span>
                                        {initiative.technologies.map((tech, idx) => (
                                            <span
                                                key={idx}
                                                className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-800/80 text-zinc-300 border border-zinc-700/70"
                                            >
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </SpotlightCard>

                            {/* Bottom Bento Strip: Quick Preview of the 6 Pillars (Click any card to open its slide) */}
                            <div>
                                <div className="flex items-center justify-between mb-2.5 px-1">
                                    <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                                        SÍNTESIS EJECUTIVA POR PILAR — CLIC EN CUALQUIER TARJETA PARA PROFUNDIZAR
                                    </span>
                                    <span className="text-[11px] font-mono text-zinc-500 tabular-nums">
                                        {substantivePillarsCount} con impacto activo · {6 - completedPillarsCount} pendientes
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                    {pillarAnalytics.map(pa => {
                                        const Icon = pa.pillar.icon;
                                        const firstBullet = pa.bullets[0] || 'Sin información registrada para este pilar.';
                                        return (
                                            <SpotlightCard
                                                key={pa.pillar.key}
                                                glowColor={pa.theme.glowRgba}
                                                onClick={() => setStep(pa.slideIndex)}
                                                className="p-4 cursor-pointer group hover:border-white/20 active:scale-[0.99]"
                                            >
                                                <div className="flex items-center justify-between gap-2 mb-2.5">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div className={clsx('p-2 rounded-lg border', pa.theme.accentBg, pa.theme.accentBorder, pa.theme.accentText)}>
                                                            <Icon size={15} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="block text-[10px] font-mono text-zinc-500">
                                                                PILAR {pa.theme.code}
                                                            </span>
                                                            <h3 className="text-xs font-semibold text-zinc-100 truncate group-hover:text-white">
                                                                {pa.pillar.label}
                                                            </h3>
                                                        </div>
                                                    </div>

                                                    {pa.metric ? (
                                                        <span
                                                            className={clsx(
                                                                'px-2 py-0.5 rounded-md text-[11px] font-mono font-bold tabular-nums border shrink-0',
                                                                pa.theme.accentBg,
                                                                pa.theme.accentBorder,
                                                                pa.theme.accentText
                                                            )}
                                                        >
                                                            {pa.metric}
                                                        </span>
                                                    ) : (
                                                        <span
                                                            className={clsx(
                                                                'px-2 py-0.5 rounded-md text-[10px] font-mono border shrink-0',
                                                                pa.statusInfo.badgeClass
                                                            )}
                                                        >
                                                            {pa.statusInfo.label}
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                                                    {firstBullet}
                                                </p>
                                            </SpotlightCard>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ══════════════════════════════════════════════════════════════════════
                        SLIDE 1: ONE-PAGER 360° (BENTO GRID DE LOS 6 PILARES CON SCROLL)
                       ══════════════════════════════════════════════════════════════════════ */}
                    {step === 1 && (
                        <div className="flex flex-col h-full justify-between gap-4 animate-in fade-in duration-300">
                            {/* Compact Header */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                                            VISTA PANORÁMICA 360° // ONE-PAGER
                                        </span>
                                        <span className="text-xs font-mono text-zinc-400">
                                            {initiative.area}
                                        </span>
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-semibold text-zinc-100 tracking-tight">
                                        {initiative.name}
                                    </h2>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-white/[0.08] text-xs font-mono tabular-nums">
                                        <span className="text-zinc-500 mr-1.5">AVANCE:</span>
                                        <span className="text-emerald-400 font-bold">{initiative.progress ?? 0}%</span>
                                    </div>
                                    <div className="px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-white/[0.08] text-xs font-mono tabular-nums">
                                        <span className="text-zinc-500 mr-1.5">PILARES:</span>
                                        <span className="text-zinc-100 font-bold">{completedPillarsCount}/6</span>
                                    </div>
                                </div>
                            </div>

                            {/* 3x2 Bento Grid with full scrollable content per pillar */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 min-h-0">
                                {pillarAnalytics.map(pa => {
                                    const Icon = pa.pillar.icon;
                                    return (
                                        <SpotlightCard
                                            key={pa.pillar.key}
                                            glowColor={pa.theme.glowRgba}
                                            className="p-5 flex flex-col justify-between min-h-[210px] max-h-[275px]"
                                        >
                                            {/* Card Top Header */}
                                            <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-white/[0.06] shrink-0">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div
                                                        className={clsx(
                                                            'p-2 rounded-xl border shrink-0',
                                                            pa.theme.accentBg,
                                                            pa.theme.accentBorder,
                                                            pa.theme.accentText
                                                        )}
                                                    >
                                                        <Icon size={16} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                                                            PILAR {pa.theme.code}
                                                        </span>
                                                        <h3 className="text-sm font-semibold text-zinc-100 truncate">
                                                            {pa.pillar.label}
                                                        </h3>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    {pa.metric ? (
                                                        <span
                                                            className={clsx(
                                                                'px-2 py-0.5 rounded-md text-[11px] font-mono font-bold tabular-nums border',
                                                                pa.theme.accentBg,
                                                                pa.theme.accentBorder,
                                                                pa.theme.accentText
                                                            )}
                                                        >
                                                            {pa.metric}
                                                        </span>
                                                    ) : (
                                                        <span
                                                            className={clsx(
                                                                'px-2 py-0.5 rounded-md text-[10px] font-mono border',
                                                                pa.statusInfo.badgeClass
                                                            )}
                                                        >
                                                            {pa.statusInfo.label}
                                                        </span>
                                                    )}

                                                    <button
                                                        onClick={() => setStep(pa.slideIndex)}
                                                        title={`Enfocar ${pa.pillar.label}`}
                                                        className="p-1.5 rounded-lg bg-zinc-800/70 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                                    >
                                                        <ArrowUpRight size={13} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Scrollable Body (Zero text cut-off!) */}
                                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2">
                                                {pa.bullets.length === 0 ? (
                                                    <p className="text-xs text-zinc-500 italic py-4">
                                                        Sin información registrada para este pilar.
                                                    </p>
                                                ) : (
                                                    pa.bullets.map((line, bIdx) => (
                                                        <div
                                                            key={bIdx}
                                                            className="flex items-start gap-2 text-xs text-zinc-300 leading-relaxed"
                                                        >
                                                            <span
                                                                className={clsx(
                                                                    'w-1.5 h-1.5 rounded-full mt-1.5 shrink-0',
                                                                    pa.theme.dotColor
                                                                )}
                                                            />
                                                            <span>{line}</span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </SpotlightCard>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ══════════════════════════════════════════════════════════════════════
                        SLIDES 2..7: DEEP-DIVE ASIMÉTRICO POR PILAR (BENTO 2 COLUMNAS)
                       ══════════════════════════════════════════════════════════════════════ */}
                    {activePillarAnalysis && (
                        <div className="flex flex-col gap-5 my-auto animate-in fade-in duration-300">
                            {/* Top Context Breadcrumb */}
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer shrink-0"
                                    >
                                        <LayoutGrid size={12} />
                                        <span>One-Pager 360°</span>
                                    </button>
                                    <span className="text-zinc-600">/</span>
                                    <span className="text-xs font-medium text-zinc-300 truncate">
                                        {initiative.name}
                                    </span>
                                </div>

                                <span className="text-xs font-mono text-zinc-500">
                                    {initiative.area} · {initiative.status || 'Sin Estatus'}
                                </span>
                            </div>

                            {/* Asymmetric 12-Col Bento Deep-Dive */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                                {/* Left Column (4 cols): Pillar Telemetry & Hero Metric */}
                                <SpotlightCard
                                    glowColor={activePillarAnalysis.theme.glowRgba}
                                    className="lg:col-span-4 p-6 flex flex-col justify-between gap-6"
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-4">
                                            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                                                PILAR {activePillarAnalysis.theme.code} DE 06
                                            </span>
                                            <span
                                                className={clsx(
                                                    'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono border',
                                                    activePillarAnalysis.statusInfo.badgeClass
                                                )}
                                            >
                                                <activePillarAnalysis.statusInfo.icon size={12} />
                                                {activePillarAnalysis.statusInfo.label}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3.5 mb-3">
                                            <div
                                                className={clsx(
                                                    'p-3.5 rounded-2xl border shadow-lg',
                                                    activePillarAnalysis.theme.accentBg,
                                                    activePillarAnalysis.theme.accentBorder,
                                                    activePillarAnalysis.theme.accentText
                                                )}
                                            >
                                                <activePillarAnalysis.pillar.icon size={28} />
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-semibold text-zinc-50 tracking-tight">
                                                    {activePillarAnalysis.pillar.label}
                                                </h2>
                                                <p className="text-xs text-zinc-400">
                                                    {activePillarAnalysis.theme.dimension}
                                                </p>
                                            </div>
                                        </div>

                                        <p className="text-xs text-zinc-400 leading-relaxed mb-5">
                                            {activePillarAnalysis.theme.description}
                                        </p>

                                        {/* Hero Extracted Metric Box */}
                                        <div className="p-4 rounded-xl bg-zinc-950/80 border border-white/[0.08]">
                                            <span className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">
                                                INDICADOR DESTACADO DETECTADO
                                            </span>
                                            {activePillarAnalysis.metric ? (
                                                <p
                                                    className={clsx(
                                                        'text-2xl md:text-3xl font-bold font-mono tabular-nums tracking-tight',
                                                        activePillarAnalysis.theme.accentText
                                                    )}
                                                >
                                                    {activePillarAnalysis.metric}
                                                </p>
                                            ) : (
                                                <p className="text-base font-mono font-semibold text-zinc-300">
                                                    {activePillarAnalysis.statusInfo.code === 'documented'
                                                        ? `${activePillarAnalysis.bullets.length} ${
                                                              activePillarAnalysis.bullets.length === 1
                                                                  ? 'Impacto Clave Documentado'
                                                                  : 'Impactos Clave Documentados'
                                                          }`
                                                        : activePillarAnalysis.statusInfo.label}
                                                </p>
                                            )}
                                        </div>

                                        {/* Strategic Tags */}
                                        {activePillarAnalysis.tags.length > 0 && (
                                            <div className="mt-4">
                                                <span className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-2">
                                                    EJES IDENTIFICADOS
                                                </span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {activePillarAnalysis.tags.map((tag, tIdx) => (
                                                        <span
                                                            key={tIdx}
                                                            className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-zinc-800/80 text-zinc-300 border border-zinc-700/70"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Mini Quick-Jump across the 6 Pillars */}
                                    <div className="pt-4 border-t border-white/[0.08]">
                                        <span className="block text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-2">
                                            CAMBIAR DE PILAR
                                        </span>
                                        <div className="grid grid-cols-3 gap-1.5">
                                            {pillarAnalytics.map(pa => {
                                                const isCurrent = pa.slideIndex === step;
                                                return (
                                                    <button
                                                        key={pa.pillar.key}
                                                        onClick={() => setStep(pa.slideIndex)}
                                                        className={clsx(
                                                            'px-2 py-1.5 rounded-lg text-[10px] font-mono text-left truncate border transition-all cursor-pointer',
                                                            isCurrent
                                                                ? clsx(
                                                                      pa.theme.accentBg,
                                                                      pa.theme.accentBorder,
                                                                      pa.theme.accentText,
                                                                      'font-bold'
                                                                  )
                                                                : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                                                        )}
                                                    >
                                                        {pa.theme.code} {pa.theme.shortName}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </SpotlightCard>

                                {/* Right Column (8 cols): Structured Bullet Breakdown Cards with Scroll */}
                                <SpotlightCard
                                    glowColor={activePillarAnalysis.theme.glowRgba}
                                    className="lg:col-span-8 p-6 md:p-8 flex flex-col justify-between min-h-[360px] max-h-[520px]"
                                >
                                    <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.08] shrink-0">
                                        <div className="flex items-center gap-2">
                                            <Layers size={16} className={activePillarAnalysis.theme.accentText} />
                                            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-300">
                                                DESGLOSE DETALLADO DE IMPACTO & JUSTIFICACIÓN EJECUTIVA
                                            </h3>
                                        </div>
                                        <span className="text-xs font-mono text-zinc-500 tabular-nums">
                                            {activePillarAnalysis.bullets.length}{' '}
                                            {activePillarAnalysis.bullets.length === 1 ? 'punto registrado' : 'puntos registrados'}
                                        </span>
                                    </div>

                                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                                        {activePillarAnalysis.bullets.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-center py-16">
                                                <MinusCircle size={36} className="text-zinc-600 mb-3" />
                                                <p className="text-base font-medium text-zinc-400">
                                                    Sin información registrada para este pilar estratégico.
                                                </p>
                                                <p className="text-xs text-zinc-500 mt-1">
                                                    Puedes documentarlo desde el editor de Impacto & Valor.
                                                </p>
                                            </div>
                                        ) : (
                                            activePillarAnalysis.bullets.map((bulletText, idx) => {
                                                const itemMetric = extractKeyMetricFromText(bulletText);
                                                return (
                                                    <div
                                                        key={idx}
                                                        className="p-4 rounded-xl bg-zinc-950/65 border border-white/[0.07] hover:border-white/[0.15] transition-colors flex items-start gap-4"
                                                    >
                                                        <span
                                                            className={clsx(
                                                                'px-2 py-1 rounded-md text-xs font-mono font-bold tabular-nums border shrink-0 mt-0.5',
                                                                activePillarAnalysis.theme.accentBg,
                                                                activePillarAnalysis.theme.accentBorder,
                                                                activePillarAnalysis.theme.accentText
                                                            )}
                                                        >
                                                            {String(idx + 1).padStart(2, '0')}
                                                        </span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-base md:text-lg text-zinc-200 leading-relaxed font-normal">
                                                                {bulletText}
                                                            </p>
                                                            {itemMetric && (
                                                                <div className="mt-2 flex items-center gap-2">
                                                                    <span
                                                                        className={clsx(
                                                                            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold tabular-nums border',
                                                                            activePillarAnalysis.theme.accentBg,
                                                                            activePillarAnalysis.theme.accentBorder,
                                                                            activePillarAnalysis.theme.accentText
                                                                        )}
                                                                    >
                                                                        <Sparkles size={11} />
                                                                        Dato Clave: {itemMetric}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </SpotlightCard>
                            </div>
                        </div>
                    )}

                </div>
            </main>

            {/* ─── 3. BOTTOM INTERACTIVE PITCH DOCK ────────────────────────────────────── */}
            <footer className="relative z-30 px-6 py-3 border-t border-white/[0.08] bg-zinc-950/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shrink-0">
                {/* Left: Keyboard Shortcut Hint */}
                <div className="hidden lg:flex items-center gap-2 text-xs text-zinc-500">
                    <span>Navegación:</span>
                    <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded border border-zinc-800 bg-zinc-900 text-zinc-400">
                        ←
                    </kbd>
                    <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded border border-zinc-800 bg-zinc-900 text-zinc-400">
                        →
                    </kbd>
                    <span>o teclas</span>
                    <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded border border-zinc-800 bg-zinc-900 text-zinc-400">
                        1-8
                    </kbd>
                </div>

                {/* Center: Interactive Slide Dock Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-0.5">
                    {/* Slide 0: Portada */}
                    <button
                        onClick={() => setStep(0)}
                        className={clsx(
                            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-[0.98]',
                            step === 0
                                ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                                : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800/80'
                        )}
                    >
                        <span className="text-[10px] font-mono opacity-60">1</span>
                        <span>Portada</span>
                    </button>

                    {/* Slide 1: One-Pager 360 */}
                    <button
                        onClick={() => setStep(1)}
                        className={clsx(
                            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-[0.98]',
                            step === 1
                                ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                                : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800/80'
                        )}
                    >
                        <LayoutGrid size={12} />
                        <span>One-Pager 360°</span>
                    </button>

                    <div className="h-4 w-px bg-zinc-800 mx-1 shrink-0" />

                    {/* Slides 2..7: The 6 Pillars */}
                    {pillarAnalytics.map(pa => {
                        const Icon = pa.pillar.icon;
                        const isActive = step === pa.slideIndex;
                        return (
                            <button
                                key={pa.pillar.key}
                                onClick={() => setStep(pa.slideIndex)}
                                className={clsx(
                                    'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-[0.98] border',
                                    isActive
                                        ? clsx(
                                              pa.theme.accentBg,
                                              pa.theme.accentBorder,
                                              pa.theme.accentText,
                                              'font-semibold'
                                          )
                                        : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                                )}
                            >
                                <Icon size={12} />
                                <span className="hidden sm:inline">{pa.theme.shortName}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Right: Prev / Next Slide Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => setStep(s => Math.max(s - 1, 0))}
                        disabled={step === 0}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] transition-all cursor-pointer"
                    >
                        <ChevronLeft size={14} />
                        <span>Anterior</span>
                    </button>
                    <button
                        onClick={() => setStep(s => Math.min(s + 1, totalSlides - 1))}
                        disabled={step === totalSlides - 1}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-[#E10600] hover:bg-red-600 text-xs font-semibold text-white disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                    >
                        <span>Siguiente</span>
                        <ChevronRight size={14} />
                    </button>
                </div>
            </footer>
        </div>
    );

    return createPortal(modalContent, document.body);
};
