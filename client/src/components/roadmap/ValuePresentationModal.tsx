import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    X, Award, MapPin, User, Rocket, ChevronLeft, ChevronRight,
    LayoutGrid, Sparkles, CheckCircle2, Clock, MinusCircle,
    FileText, FileSpreadsheet, Cpu, ChevronDown, ArrowUpRight,
    Layers, ShieldCheck, Check, Sun, Moon
} from 'lucide-react';
import { clsx } from 'clsx';
import {
    stripHtml,
    isNAPillar,
    isPillarFilled,
    isPillarCompleted,
    isPendingDocumentation,
    isUnquantifiedPillarText,
    getMergedOperationalEfficiencyText
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

type PresentationDesignMode = 'mode1' | 'mode2';

// ─── Custom Bespoke SVG Illustrations for Mode 2 (Executive Minimalist) ──────────

const PillarIllustrationSVG: React.FC<{ pillarKey: keyof ValueData; className?: string }> = ({
    pillarKey,
    className = 'w-24 h-24',
}) => {
    switch (pillarKey) {
        case 'business_value':
            return (
                <svg viewBox="0 0 120 120" fill="none" className={className}>
                    <circle cx="60" cy="60" r="52" fill="#F5F3FF" stroke="#DDD6FE" strokeWidth="1.5" />
                    <circle cx="60" cy="60" r="40" stroke="#EDE9FE" strokeWidth="1" strokeDasharray="3 3" />
                    <rect x="32" y="68" width="12" height="22" rx="3" fill="#C4B5FD" />
                    <rect x="49" y="54" width="12" height="36" rx="3" fill="#8B5CF6" />
                    <rect x="66" y="40" width="12" height="50" rx="3" fill="#5B21B6" />
                    <path
                        d="M30 58C45 55 58 42 82 28"
                        stroke="#4C1D95"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                    />
                    <circle cx="82" cy="28" r="4.5" fill="#4C1D95" />
                    <circle cx="82" cy="28" r="8" stroke="#8B5CF6" strokeWidth="1.2" opacity="0.5" />
                </svg>
            );
        case 'operational_efficiency':
            return (
                <svg viewBox="0 0 120 120" fill="none" className={className}>
                    <circle cx="60" cy="60" r="52" fill="#FFFBEB" stroke="#FDE68A" strokeWidth="1.5" />
                    <circle cx="52" cy="54" r="22" stroke="#D97706" strokeWidth="2.2" />
                    <circle cx="52" cy="54" r="9" fill="#F59E0B" fillOpacity="0.25" stroke="#B45309" strokeWidth="1.8" />
                    <circle cx="76" cy="72" r="15" stroke="#B45309" strokeWidth="2" strokeDasharray="4 2" />
                    <path
                        d="M52 26V32M52 76V82M24 54H30M74 54H80"
                        stroke="#D97706"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                    />
                    <path d="M68 32L58 50H70L60 68" stroke="#92400E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            );
        case 'fte_detail':
            return (
                <svg viewBox="0 0 120 120" fill="none" className={className}>
                    <circle cx="60" cy="60" r="52" fill="#ECFEFF" stroke="#A5F3FC" strokeWidth="1.5" />
                    <circle cx="60" cy="60" r="34" stroke="#0891B2" strokeWidth="2" strokeOpacity="0.35" />
                    <path
                        d="M60 26A34 34 0 1 1 29 74"
                        stroke="#0E7490"
                        strokeWidth="3"
                        strokeLinecap="round"
                    />
                    <circle cx="60" cy="50" r="10" fill="#06B6D4" fillOpacity="0.2" stroke="#0E7490" strokeWidth="2" />
                    <path
                        d="M42 78C42 69.5 50 64 60 64C70 64 78 69.5 78 78"
                        stroke="#0E7490"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                    />
                    <path d="M78 36L86 28M86 28H79M86 28V35" stroke="#0891B2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            );
        case 'qualitative_benefit':
            return (
                <svg viewBox="0 0 120 120" fill="none" className={className}>
                    <circle cx="60" cy="60" r="52" fill="#FFF1F2" stroke="#FECDD3" strokeWidth="1.5" />
                    <path
                        d="M60 26L86 37V58C86 76 74.5 89.5 60 95C45.5 89.5 34 76 34 58V37L60 26Z"
                        fill="#FFE4E6"
                        stroke="#BE123C"
                        strokeWidth="2.2"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M49 60L57 68L73 50"
                        stroke="#9F1239"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            );
        case 'users_reached_detail':
            return (
                <svg viewBox="0 0 120 120" fill="none" className={className}>
                    <circle cx="60" cy="60" r="52" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="1.5" />
                    <line x1="60" y1="60" x2="36" y2="40" stroke="#10B981" strokeWidth="1.8" />
                    <line x1="60" y1="60" x2="85" y2="42" stroke="#10B981" strokeWidth="1.8" />
                    <line x1="60" y1="60" x2="38" y2="82" stroke="#10B981" strokeWidth="1.8" />
                    <line x1="60" y1="60" x2="84" y2="80" stroke="#10B981" strokeWidth="1.8" />
                    <circle cx="60" cy="60" r="13" fill="#059669" />
                    <circle cx="36" cy="40" r="7" fill="#D1FAE5" stroke="#047857" strokeWidth="2" />
                    <circle cx="85" cy="42" r="7" fill="#D1FAE5" stroke="#047857" strokeWidth="2" />
                    <circle cx="38" cy="82" r="7" fill="#D1FAE5" stroke="#047857" strokeWidth="2" />
                    <circle cx="84" cy="80" r="7" fill="#D1FAE5" stroke="#047857" strokeWidth="2" />
                </svg>
            );
        case 'estimated_savings_detail':
            return (
                <svg viewBox="0 0 120 120" fill="none" className={className}>
                    <circle cx="60" cy="60" r="52" fill="#F0FDF4" stroke="#BBF7D0" strokeWidth="1.5" />
                    <ellipse cx="54" cy="76" rx="22" ry="8" fill="#DCFCE7" stroke="#15803D" strokeWidth="2" />
                    <path d="M32 64C32 68.4 41.8 72 54 72C66.2 72 76 68.4 76 64" stroke="#15803D" strokeWidth="2" />
                    <ellipse cx="54" cy="54" rx="22" ry="8" fill="#BBF7D0" stroke="#15803D" strokeWidth="2" />
                    <path d="M32 54V76M76 54V76" stroke="#15803D" strokeWidth="2" />
                    <circle cx="80" cy="44" r="14" fill="#166534" />
                    <path d="M80 37V51M76 41H82.5C84 41 84 44 82 44H78C76 44 76 47 78 47H84" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
            );
    }
};

const ExecutiveRadialProgressSVG: React.FC<{ progress: number; completedPillars: number }> = ({
    progress,
    completedPillars,
}) => {
    const clamped = Math.max(0, Math.min(100, progress || 0));
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (clamped / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center w-36 h-36 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 132 132">
                <circle
                    cx="66"
                    cy="66"
                    r="60"
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="1"
                    strokeDasharray="2 3"
                />
                <circle
                    cx="66"
                    cy="66"
                    r={radius}
                    fill="none"
                    stroke="#F1F5F9"
                    strokeWidth="9"
                />
                <circle
                    cx="66"
                    cy="66"
                    r={radius}
                    fill="none"
                    stroke="#0F172A"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-700"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span
                    className="text-3xl font-bold text-slate-900 tracking-tight"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                    {clamped}%
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mt-0.5">
                    Avance
                </span>
                <span className="mt-1 px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-700">
                    {completedPillars}/5 Pilares
                </span>
            </div>
        </div>
    );
};

// ─── Spotlight Card for Mode 1 (Tech Dark) ───────────────────────────────────────

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
        roman: string;
        shortName: string;
        dimension: string;
        description: string;
        accentText: string;
        accentBg: string;
        accentBorder: string;
        dotColor: string;
        glowRgba: string;
        // Mode 2 (Executive Minimalist Light) colors:
        lightAccentText: string;
        lightAccentBg: string;
        lightAccentBorder: string;
        lightBarColor: string;
    }
> = {
    business_value: {
        code: '01',
        roman: 'I',
        shortName: 'Negocio',
        dimension: 'Alineación Estratégica & Flujo Protegido',
        description: 'Impacto en objetivos financieros, continuidad operativa, cobranza e ingresos del negocio.',
        accentText: 'text-violet-400',
        accentBg: 'bg-violet-500/10',
        accentBorder: 'border-violet-500/25',
        dotColor: 'bg-violet-400',
        glowRgba: 'rgba(139, 92, 246, 0.12)',
        lightAccentText: 'text-violet-800',
        lightAccentBg: 'bg-violet-50/90',
        lightAccentBorder: 'border-violet-200',
        lightBarColor: 'bg-violet-700',
    },
    operational_efficiency: {
        code: '02',
        roman: 'II',
        shortName: 'Eficiencia',
        dimension: 'Optimización de Procesos, Horas Liberadas & Tiempos de Ciclo',
        description: 'Reducción de tiempos de ejecución, horas liberadas al mes, eliminación de tareas manuales y estandarización operativa.',
        accentText: 'text-amber-400',
        accentBg: 'bg-amber-500/10',
        accentBorder: 'border-amber-500/25',
        dotColor: 'bg-amber-400',
        glowRgba: 'rgba(245, 158, 11, 0.12)',
        lightAccentText: 'text-amber-800',
        lightAccentBg: 'bg-amber-50/90',
        lightAccentBorder: 'border-amber-200',
        lightBarColor: 'bg-amber-600',
    },
    fte_detail: {
        code: '02',
        roman: 'II',
        shortName: 'Capacidad',
        dimension: 'Capacidad Operativa & Horas-Hombre',
        description: 'Liberación o reasignación de talento y tiempo operativo hacia actividades analíticas de valor.',
        accentText: 'text-cyan-400',
        accentBg: 'bg-cyan-500/10',
        accentBorder: 'border-cyan-500/25',
        dotColor: 'bg-cyan-400',
        glowRgba: 'rgba(6, 182, 212, 0.12)',
        lightAccentText: 'text-cyan-800',
        lightAccentBg: 'bg-cyan-50/90',
        lightAccentBorder: 'border-cyan-200',
        lightBarColor: 'bg-cyan-700',
    },
    qualitative_benefit: {
        code: '03',
        roman: 'III',
        shortName: 'Cualitativo',
        dimension: 'Gobernanza, Mitigación de Riesgo & Calidad',
        description: 'Beneficios intangibles en control interno, cumplimiento normativo/SOX, trazabilidad y certidumbre.',
        accentText: 'text-rose-400',
        accentBg: 'bg-rose-500/10',
        accentBorder: 'border-rose-500/25',
        dotColor: 'bg-rose-400',
        glowRgba: 'rgba(244, 63, 94, 0.12)',
        lightAccentText: 'text-rose-800',
        lightAccentBg: 'bg-rose-50/90',
        lightAccentBorder: 'border-rose-200',
        lightBarColor: 'bg-rose-700',
    },
    users_reached_detail: {
        code: '04',
        roman: 'IV',
        shortName: 'Usuarios',
        dimension: 'Alcance Organizacional & Adopción',
        description: 'Equipos, especialistas, áreas financieras y geografías beneficiadas por la iniciativa.',
        accentText: 'text-emerald-400',
        accentBg: 'bg-emerald-500/10',
        accentBorder: 'border-emerald-500/25',
        dotColor: 'bg-emerald-400',
        glowRgba: 'rgba(16, 185, 129, 0.12)',
        lightAccentText: 'text-emerald-800',
        lightAccentBg: 'bg-emerald-50/90',
        lightAccentBorder: 'border-emerald-200',
        lightBarColor: 'bg-emerald-700',
    },
    estimated_savings_detail: {
        code: '05',
        roman: 'V',
        shortName: 'Ahorro',
        dimension: 'Impacto Económico & Optimización de Costos',
        description: 'Ahorro financiero directo, recuperación en aclaraciones comerciales y eficiencia en recursos.',
        accentText: 'text-green-400',
        accentBg: 'bg-green-500/10',
        accentBorder: 'border-green-500/25',
        dotColor: 'bg-green-400',
        glowRgba: 'rgba(34, 197, 94, 0.12)',
        lightAccentText: 'text-green-800',
        lightAccentBg: 'bg-green-50/90',
        lightAccentBorder: 'border-green-200',
        lightBarColor: 'bg-green-700',
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
    lightBadgeClass: string;
    icon: any;
} {
    if (!isPillarFilled(raw)) {
        return {
            label: 'Sin Documentar',
            code: 'empty',
            badgeClass: 'bg-zinc-800/80 text-zinc-400 border-zinc-700/80',
            lightBadgeClass: 'bg-slate-100 text-slate-500 border-slate-200',
            icon: MinusCircle,
        };
    }
    if (isNAPillar(raw)) {
        return {
            label: 'No Aplica (N/A)',
            code: 'na',
            badgeClass: 'bg-zinc-800/90 text-zinc-300 border-zinc-700',
            lightBadgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
            icon: MinusCircle,
        };
    }
    if (isPendingDocumentation(raw)) {
        return {
            label: 'Pendiente Gerencia',
            code: 'pending_mgmt',
            badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
            lightBadgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
            icon: Clock,
        };
    }
    if (isUnquantifiedPillarText(raw)) {
        return {
            label: 'En Cuantificación',
            code: 'unquantified',
            badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
            lightBadgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
            icon: Clock,
        };
    }
    return {
        label: 'Documentado',
        code: 'documented',
        badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
        lightBadgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
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
    // 0 = Portada Ejecutiva
    // 1 = Panorama 360° (One-Pager de los 5 Pilares)
    // 2..6 = Deep-Dive into Pillar 1..5
    const [step, setStep] = useState(0);
    const [designMode, setDesignMode] = useState<PresentationDesignMode>(() => {
        const saved = localStorage.getItem('tfbe_presentation_design_mode');
        return saved === 'mode1' || saved === 'mode2' ? saved : 'mode2';
    });
    const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
    const [switcherQuery, setSwitcherQuery] = useState('');
    const totalSlides = pillars.length + 2; // 7 slides (0..6)

    const handleChangeMode = (mode: PresentationDesignMode) => {
        setDesignMode(mode);
        localStorage.setItem('tfbe_presentation_design_mode', mode);
    };

    // Keyboard navigation (<-, ->, 1..7, Esc)
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
            } else if (/^[1-7]$/.test(e.key)) {
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

    const pillarAnalytics = useMemo(() => {
        return pillars.map((p, idx) => {
            const raw =
                p.key === 'operational_efficiency'
                    ? getMergedOperationalEfficiencyText(data as unknown as Record<string, string>)
                    : data[p.key] || '';
            const bullets = extractPillarBullets(raw);
            const metric = extractKeyMetricFromText(raw);
            const statusInfo = getPillarStatusInfo(raw);
            const tags = detectPillarTags(raw);
            const theme = PILLAR_THEME[p.key];
            return {
                pillar: p,
                index: idx,
                slideIndex: idx + 2, // Slides 2..6
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
        () =>
            pillars.filter(p => {
                const raw =
                    p.key === 'operational_efficiency'
                        ? getMergedOperationalEfficiencyText(data as unknown as Record<string, string>)
                        : data[p.key];
                return isPillarCompleted(raw);
            }).length,
        [pillars, data]
    );

    const substantivePillarsCount = useMemo(
        () => pillarAnalytics.filter(pa => pa.statusInfo.code === 'documented').length,
        [pillarAnalytics]
    );

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
    const isExecutiveLight = designMode === 'mode2';

    const getStatusBadgeStyleDark = (status?: string) => {
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

    const getStatusBadgeStyleLight = (status?: string) => {
        const s = (status || '').toLowerCase();
        if (s.includes('atraso') || s.includes('retrasado')) {
            return 'bg-rose-50 text-rose-800 border-rose-200';
        }
        if (s.includes('redefinición')) {
            return 'bg-amber-50 text-amber-800 border-amber-200';
        }
        if (s.includes('entregado')) {
            return 'bg-sky-50 text-sky-800 border-sky-200';
        }
        if (s.includes('en curso') || s.includes('avance')) {
            return 'bg-emerald-50 text-emerald-800 border-emerald-200';
        }
        return 'bg-slate-100 text-slate-700 border-slate-200';
    };

    const modalContent = (
        <div
            style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}
            className={clsx(
                'fixed inset-0 z-[999999] flex flex-col overflow-hidden select-none transition-colors duration-300',
                isExecutiveLight ? 'bg-[#F7F6F2] text-slate-900' : 'bg-[#09090b] text-zinc-100'
            )}
        >
            {/* ─── Background Layer per Mode ─── */}
            {isExecutiveLight ? (
                <>
                    {/* Subtle Warm Alabaster Editorial Paper Texture & Architectural Accents */}
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#cbd5e1_0.8px,transparent_0.8px)] [background-size:24px_24px] opacity-40" />
                    <div className="pointer-events-none absolute top-0 inset-x-0 h-1 bg-[#0F172A]" />
                    <div className="pointer-events-none absolute top-1 left-0 w-48 h-1 bg-[#C8102E]" />
                </>
            ) : (
                <>
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#ffffff12_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_45%,#000_60%,transparent_100%)]" />
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                </>
            )}

            {/* ─── 1. TOP CONTROL BAR (With Mode 1 / Mode 2 Switcher!) ─────────────────── */}
            <header
                className={clsx(
                    'relative z-30 flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b shrink-0 transition-colors',
                    isExecutiveLight
                        ? 'bg-white/90 border-slate-200/90 backdrop-blur-md shadow-[0_1px_3px_rgba(15,23,42,0.03)]'
                        : 'bg-zinc-950/80 border-white/[0.08] backdrop-blur-md'
                )}
            >
                {/* Left: Corporate Brand & Mode Switcher */}
                <div className="flex flex-wrap items-center gap-3">
                    <div
                        className={clsx(
                            'flex items-center gap-2.5 pr-3 border-r',
                            isExecutiveLight ? 'border-slate-200' : 'border-white/[0.08]'
                        )}
                    >
                        <div
                            className={clsx(
                                'w-8 h-8 rounded-lg flex items-center justify-center shadow-sm',
                                isExecutiveLight ? 'bg-[#0F172A]' : 'bg-[#E10600]'
                            )}
                        >
                            <Award size={16} className="text-white" />
                        </div>
                        <div>
                            <span
                                className={clsx(
                                    'block text-[10px] uppercase tracking-widest font-bold',
                                    isExecutiveLight ? 'text-[#C8102E]' : 'text-zinc-400 font-mono'
                                )}
                            >
                                Transformación Finanzas
                            </span>
                            <span
                                className={clsx(
                                    'block text-xs font-bold tracking-tight',
                                    isExecutiveLight ? 'text-slate-900' : 'text-zinc-100'
                                )}
                            >
                                Presentación Ejecutiva
                            </span>
                        </div>
                    </div>

                    {/* ★ MODE SWITCHER: MODO 1 (TECH DARK) vs MODO 2 (EJECUTIVO MINIMALISTA) ★ */}
                    <div
                        className={clsx(
                            'inline-flex items-center p-1 rounded-xl border',
                            isExecutiveLight
                                ? 'bg-slate-100 border-slate-200/90'
                                : 'bg-zinc-900 border-zinc-800'
                        )}
                        title="Alternar estilo visual de la presentación"
                    >
                        <button
                            onClick={() => handleChangeMode('mode1')}
                            className={clsx(
                                'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                                designMode === 'mode1'
                                    ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                                    : isExecutiveLight
                                    ? 'text-slate-500 hover:text-slate-800'
                                    : 'text-zinc-400 hover:text-zinc-200'
                            )}
                        >
                            <Moon size={12} />
                            <span>Modo 1 · Tech</span>
                        </button>
                        <button
                            onClick={() => handleChangeMode('mode2')}
                            className={clsx(
                                'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                                designMode === 'mode2'
                                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                                    : 'text-zinc-400 hover:text-white'
                            )}
                        >
                            <Sun size={12} className={designMode === 'mode2' ? 'text-amber-500' : ''} />
                            <span>Modo 2 · Ejecutivo</span>
                        </button>
                    </div>
                </div>

                {/* Center: Live Initiative Switcher */}
                {allInitiatives.length > 0 && onSelectInitiative && (
                    <div className="relative flex items-center gap-1.5">
                        <button
                            onClick={() => prevInit && onSelectInitiative(prevInit.id, prevInit.name)}
                            disabled={!prevInit}
                            title={prevInit ? `Anterior: ${prevInit.name}` : 'Primera iniciativa'}
                            className={clsx(
                                'p-1.5 rounded-lg border transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer',
                                isExecutiveLight
                                    ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                    : 'border-zinc-800 bg-zinc-900/90 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                            )}
                        >
                            <ChevronLeft size={15} />
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setIsSwitcherOpen(prev => !prev)}
                                className={clsx(
                                    'flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg border text-left transition-all active:scale-[0.99] cursor-pointer max-w-[260px] sm:max-w-[360px]',
                                    isExecutiveLight
                                        ? 'border-slate-200 bg-white hover:bg-slate-50 text-slate-900 shadow-2xs'
                                        : 'border-zinc-800 bg-zinc-900/90 hover:bg-zinc-800/90 text-zinc-100'
                                )}
                                title="Cambiar de iniciativa sin salir de la presentación"
                            >
                                <span
                                    className={clsx(
                                        'text-[10px] font-bold tabular-nums shrink-0 px-1.5 py-0.5 rounded',
                                        isExecutiveLight
                                            ? 'bg-slate-100 text-slate-600'
                                            : 'text-zinc-400 font-mono'
                                    )}
                                >
                                    {currentInitIdx >= 0 ? `${currentInitIdx + 1}/${allInitiatives.length}` : 'INIT'}
                                </span>
                                <span className="text-xs font-semibold truncate">{initiative.name}</span>
                                <ChevronDown
                                    size={13}
                                    className={clsx(
                                        'shrink-0 transition-transform',
                                        isExecutiveLight ? 'text-slate-400' : 'text-zinc-400',
                                        isSwitcherOpen && 'rotate-180'
                                    )}
                                />
                            </button>

                            {isSwitcherOpen && (
                                <div
                                    className={clsx(
                                        'absolute left-1/2 -translate-x-1/2 top-full mt-2 w-80 sm:w-96 rounded-xl border shadow-2xl overflow-hidden z-50',
                                        isExecutiveLight
                                            ? 'bg-white border-slate-200 text-slate-900'
                                            : 'bg-zinc-950/95 border-zinc-800 text-zinc-100 backdrop-blur-xl'
                                    )}
                                >
                                    <div
                                        className={clsx(
                                            'p-2 border-b',
                                            isExecutiveLight ? 'border-slate-100 bg-slate-50/60' : 'border-zinc-800/80'
                                        )}
                                    >
                                        <input
                                            type="text"
                                            value={switcherQuery}
                                            onChange={e => setSwitcherQuery(e.target.value)}
                                            placeholder="Buscar otra iniciativa para presentar..."
                                            className={clsx(
                                                'w-full px-3 py-1.5 rounded-lg border text-xs focus:outline-none',
                                                isExecutiveLight
                                                    ? 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-slate-400'
                                                    : 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-zinc-600'
                                            )}
                                            autoFocus
                                        />
                                    </div>
                                    <div
                                        className={clsx(
                                            'max-h-64 overflow-y-auto custom-scrollbar divide-y',
                                            isExecutiveLight ? 'divide-slate-100' : 'divide-zinc-900'
                                        )}
                                    >
                                        {filteredSwitcherInits.map(item => {
                                            const v = allValues[item.id];
                                            const itemCompleted = v
                                                ? pillars.filter(p => {
                                                      const raw =
                                                          p.key === 'operational_efficiency'
                                                              ? getMergedOperationalEfficiencyText(v as unknown as Record<string, string>)
                                                              : v[p.key];
                                                      return isPillarCompleted(raw);
                                                  }).length
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
                                                        'w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer',
                                                        isExecutiveLight
                                                            ? clsx('hover:bg-slate-50', isCurrent && 'bg-slate-100/80')
                                                            : clsx('hover:bg-zinc-900/90', isCurrent && 'bg-zinc-900')
                                                    )}
                                                >
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold truncate flex items-center gap-1.5">
                                                            {isCurrent && (
                                                                <Check
                                                                    size={12}
                                                                    className={isExecutiveLight ? 'text-emerald-600 shrink-0' : 'text-emerald-400 shrink-0'}
                                                                />
                                                            )}
                                                            <span className="truncate">{item.name}</span>
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 truncate">
                                                            {item.area || 'General'} · {item.status || 'Sin estatus'}
                                                        </p>
                                                    </div>
                                                    <span
                                                        className={clsx(
                                                            'px-1.5 py-0.5 rounded text-[10px] font-bold tabular-nums shrink-0',
                                                            itemCompleted === pillars.length
                                                                ? isExecutiveLight
                                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                                                                : itemCompleted > 0
                                                                ? isExecutiveLight
                                                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                                                                : isExecutiveLight
                                                                ? 'bg-slate-100 text-slate-400'
                                                                : 'bg-zinc-800 text-zinc-500'
                                                        )}
                                                    >
                                                        {itemCompleted}/{pillars.length}
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
                            title={nextInit ? `Siguiente: ${nextInit.name}` : 'Última iniciativa'}
                            className={clsx(
                                'p-1.5 rounded-lg border transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer',
                                isExecutiveLight
                                    ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                    : 'border-zinc-800 bg-zinc-900/90 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                            )}
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
                            className={clsx(
                                'hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer',
                                isExecutiveLight
                                    ? 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs'
                                    : 'border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white'
                            )}
                        >
                            <FileText size={13} className="text-rose-500" />
                            <span>PDF</span>
                        </button>
                    )}
                    {onExportExcel && (
                        <button
                            onClick={onExportExcel}
                            title="Descargar Ficha Técnica en Excel"
                            className={clsx(
                                'hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer',
                                isExecutiveLight
                                    ? 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs'
                                    : 'border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white'
                            )}
                        >
                            <FileSpreadsheet size={13} className="text-emerald-600" />
                            <span>Excel</span>
                        </button>
                    )}

                    <button
                        onClick={onClose}
                        className={clsx(
                            'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer',
                            isExecutiveLight
                                ? 'border-slate-200 bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
                                : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white'
                        )}
                        title="Cerrar presentación (Esc)"
                    >
                        <span>Cerrar</span>
                        <X size={14} />
                    </button>
                </div>
            </header>

            {/* ══════════════════════════════════════════════════════════════════════════
                2. MAIN SLIDE STAGE — MODO 2 (EJECUTIVO MINIMALISTA / EDITORIAL)
               ══════════════════════════════════════════════════════════════════════════ */}
            {isExecutiveLight ? (
                <main className="relative z-10 flex-1 min-h-0 overflow-y-auto custom-scrollbar px-6 py-6 md:px-12 md:py-8 flex flex-col justify-center">
                    <div className="w-full max-w-7xl mx-auto h-full flex flex-col justify-center">

                        {/* ── MODO 2 // SLIDE 0: PORTADA EJECUTIVA DE CONSEJO DIRECTIVO ── */}
                        {step === 0 && (
                            <div className="flex flex-col justify-between gap-7 my-auto animate-in fade-in duration-300">
                                {/* Main Editorial Cover Sheet */}
                                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_24px_60px_rgba(15,23,42,0.06)] p-8 md:p-11 relative overflow-hidden">
                                    {/* Top subtle crimson & navy ribbon */}
                                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0F172A] via-[#0F172A] to-[#C8102E]" />

                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                                        {/* Left 8 Cols: Editorial Title & Executive Metadata */}
                                        <div className="lg:col-span-8 flex flex-col justify-between">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2.5 mb-5">
                                                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C8102E]">
                                                        Caso de Negocio & Valor Estratégico
                                                    </span>
                                                    <span className="text-slate-300">•</span>
                                                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-0.5 rounded-full">
                                                        {initiative.area || 'Dirección de Finanzas'}
                                                    </span>
                                                    <span
                                                        className={clsx(
                                                            'text-xs font-semibold px-3 py-0.5 rounded-full border',
                                                            getStatusBadgeStyleLight(initiative.status)
                                                        )}
                                                    >
                                                        {initiative.status || 'En Curso'}
                                                    </span>
                                                </div>

                                                <h1
                                                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                                                    className="text-3xl sm:text-5xl font-semibold text-slate-900 tracking-tight leading-[1.14] mb-5"
                                                >
                                                    {initiative.name}
                                                </h1>

                                                <p className="text-sm md:text-base text-slate-600 leading-relaxed max-w-3xl mb-7">
                                                    {pillarAnalytics[0]?.bullets[0] ||
                                                        'Evaluación integral del impacto estratégico, eficiencia operativa, alcance organizacional y retorno económico de la iniciativa.'}
                                                </p>
                                            </div>

                                            {/* Clean Hairline Governance Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-200/80">
                                                <div>
                                                    <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                                                        Líder de Transformación
                                                    </span>
                                                    <p className="text-sm font-bold text-slate-800">
                                                        {initiative.transformation_lead || initiative.champion || 'Por asignar'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                                                        Sponsor / Champion
                                                    </span>
                                                    <p className="text-sm font-bold text-slate-800">
                                                        {initiative.champion || initiative.transformation_lead || 'Por asignar'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                                                        Ecosistema Tecnológico
                                                    </span>
                                                    <p className="text-sm font-bold text-slate-800 truncate">
                                                        {initiative.technologies && initiative.technologies.length > 0
                                                            ? initiative.technologies.join(', ')
                                                            : 'Plataforma Corporativa'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right 4 Cols: Bespoke Radial Progress Gauge & Executive Action */}
                                        <div className="lg:col-span-4 lg:border-l lg:border-slate-100 lg:pl-8 flex flex-col items-center justify-center text-center">
                                            <ExecutiveRadialProgressSVG
                                                progress={initiative.progress ?? 0}
                                                completedPillars={completedPillarsCount}
                                            />

                                            <div className="mt-5 w-full space-y-2">
                                                <button
                                                    onClick={() => setStep(1)}
                                                    className="w-full py-2.5 px-4 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold tracking-wide flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer"
                                                >
                                                    <LayoutGrid size={14} />
                                                    <span>Ver Resumen Ejecutivo 360°</span>
                                                </button>
                                                <button
                                                    onClick={() => setStep(2)}
                                                    className="w-full py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                                >
                                                    <span>Recorrer Pilares Detallados</span>
                                                    <ChevronRight size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom 6-Pillar Executive Summary Strip */}
                                <div>
                                    <div className="flex items-center justify-between mb-3 px-1">
                                        <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">
                                            Dimensiones de Valor Documentadas (Selecciona un pilar para abrir su lámina)
                                        </span>
                                        <span className="text-xs font-semibold text-slate-500">
                                            {substantivePillarsCount} pilares con impacto activo
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                                        {pillarAnalytics.map(pa => {
                                            const Icon = pa.pillar.icon;
                                            return (
                                                <button
                                                    key={pa.pillar.key}
                                                    onClick={() => setStep(pa.slideIndex)}
                                                    className="group text-left bg-white hover:bg-slate-50/90 rounded-2xl p-4 border border-slate-200/90 hover:border-slate-300 shadow-[0_4px_20px_rgba(15,23,42,0.03)] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                                                >
                                                    <div>
                                                        <div className="flex items-center justify-between gap-2 mb-2.5">
                                                            <span
                                                                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                                                                className="text-base font-bold italic text-slate-400 group-hover:text-slate-700 transition-colors"
                                                            >
                                                                {pa.theme.roman}.
                                                            </span>
                                                            <div
                                                                className={clsx(
                                                                    'p-1.5 rounded-lg border',
                                                                    pa.theme.lightAccentBg,
                                                                    pa.theme.lightAccentBorder,
                                                                    pa.theme.lightAccentText
                                                                )}
                                                            >
                                                                <Icon size={14} />
                                                            </div>
                                                        </div>
                                                        <h3 className="text-xs font-bold text-slate-900 mb-1 line-clamp-1">
                                                            {pa.pillar.label}
                                                        </h3>
                                                    </div>

                                                    <div className="mt-2 pt-2 border-t border-slate-100">
                                                        {pa.metric ? (
                                                            <span
                                                                className={clsx(
                                                                    'block text-xs font-extrabold truncate',
                                                                    pa.theme.lightAccentText
                                                                )}
                                                            >
                                                                {pa.metric}
                                                            </span>
                                                        ) : (
                                                            <span className="block text-[11px] font-medium text-slate-500 truncate">
                                                                {pa.statusInfo.label}
                                                            </span>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── MODO 2 // SLIDE 1: RESUMEN EJECUTIVO 360° (BOARDROOM ONE-PAGER) ── */}
                        {step === 1 && (
                            <div className="flex flex-col h-full justify-between gap-5 animate-in fade-in duration-300">
                                {/* Editorial Header */}
                                <div className="bg-white rounded-2xl px-6 py-4 border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-4">
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C8102E] block mb-0.5">
                                            Vista Integral de Consejo · 5 Dimensiones de Valor
                                        </span>
                                        <h2
                                            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                                            className="text-xl md:text-2xl font-semibold text-slate-900"
                                        >
                                            {initiative.name}
                                        </h2>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                                            {initiative.area}
                                        </span>
                                        <span
                                            className={clsx(
                                                'text-xs font-semibold px-3 py-1 rounded-full border',
                                                getStatusBadgeStyleLight(initiative.status)
                                            )}
                                        >
                                            {initiative.status || 'En Curso'} · {initiative.progress ?? 0}%
                                        </span>
                                    </div>
                                </div>

                                {/* 5-Card Executive Matrix (3 top + 2 bottom) with Independent Scroll */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 flex-1 min-h-0">
                                    {pillarAnalytics.map((pa, idx) => {
                                        const Icon = pa.pillar.icon;
                                        const spanClass =
                                            idx < 3
                                                ? 'lg:col-span-2'
                                                : idx === 4
                                                ? 'md:col-span-2 lg:col-span-3'
                                                : 'lg:col-span-3';
                                        return (
                                            <div
                                                key={pa.pillar.key}
                                                className={clsx(
                                                    spanClass,
                                                    'bg-white rounded-2xl border border-slate-200/90 shadow-[0_8px_30px_rgba(15,23,42,0.04)] p-5 flex flex-col justify-between min-h-[210px] max-h-[275px] relative overflow-hidden'
                                                )}
                                            >
                                                {/* Top subtle color bar */}
                                                <div className={clsx('absolute top-0 left-0 right-0 h-1', pa.theme.lightBarColor)} />

                                                {/* Card Header */}
                                                <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100 shrink-0">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div
                                                            className={clsx(
                                                                'p-2 rounded-xl border shrink-0',
                                                                pa.theme.lightAccentBg,
                                                                pa.theme.lightAccentBorder,
                                                                pa.theme.lightAccentText
                                                            )}
                                                        >
                                                            <Icon size={16} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                                                Pilar {pa.theme.roman}
                                                            </span>
                                                            <h3 className="text-sm font-bold text-slate-900 truncate">
                                                                {pa.pillar.label}
                                                            </h3>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        {pa.metric ? (
                                                            <span
                                                                className={clsx(
                                                                    'px-2.5 py-0.5 rounded-full text-[11px] font-bold border',
                                                                    pa.theme.lightAccentBg,
                                                                    pa.theme.lightAccentBorder,
                                                                    pa.theme.lightAccentText
                                                                )}
                                                            >
                                                                {pa.metric}
                                                            </span>
                                                        ) : (
                                                            <span
                                                                className={clsx(
                                                                    'px-2.5 py-0.5 rounded-full text-[10px] font-semibold border',
                                                                    pa.statusInfo.lightBadgeClass
                                                                )}
                                                            >
                                                                {pa.statusInfo.label}
                                                            </span>
                                                        )}

                                                        <button
                                                            onClick={() => setStep(pa.slideIndex)}
                                                            title={`Abrir lámina de ${pa.pillar.label}`}
                                                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                                                        >
                                                            <ArrowUpRight size={13} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Scrollable Bullet List */}
                                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2">
                                                    {pa.bullets.length === 0 ? (
                                                        <p className="text-xs text-slate-400 italic py-4">
                                                            Sin información documentada en este pilar.
                                                        </p>
                                                    ) : (
                                                        pa.bullets.map((line, bIdx) => (
                                                            <div
                                                                key={bIdx}
                                                                className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed"
                                                            >
                                                                <span
                                                                    className={clsx(
                                                                        'w-1.5 h-1.5 rounded-full mt-1.5 shrink-0',
                                                                        pa.theme.lightBarColor
                                                                    )}
                                                                />
                                                                <span>{line}</span>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ── MODO 2 // SLIDES 2..7: LÁMINA EJECUTIVA POR PILAR (CON ILUSTRACIÓN SVG) ── */}
                        {activePillarAnalysis && (
                            <div className="flex flex-col gap-5 my-auto animate-in fade-in duration-300">
                                {/* Top Executive Breadcrumb */}
                                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setStep(1)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
                                        >
                                            <LayoutGrid size={12} />
                                            <span>Vista 360°</span>
                                        </button>
                                        <span className="text-slate-300">/</span>
                                        <span
                                            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                                            className="text-sm font-semibold italic text-slate-700"
                                        >
                                            {initiative.name}
                                        </span>
                                    </div>
                                    <span className="text-xs font-semibold text-slate-500">
                                        {initiative.area} · Avance {initiative.progress ?? 0}%
                                    </span>
                                </div>

                                {/* Main Editorial Two-Column Card */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                                    {/* Left Column (4 cols): Custom SVG Illustration + Editorial Numeral + Key Metric */}
                                    <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/90 shadow-[0_20px_50px_rgba(15,23,42,0.05)] p-7 flex flex-col justify-between relative overflow-hidden">
                                        <div className={clsx('absolute top-0 left-0 right-0 h-1.5', activePillarAnalysis.theme.lightBarColor)} />

                                        <div>
                                            <div className="flex items-start justify-between gap-3 mb-4">
                                                <div>
                                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 block">
                                                        Dimensión Estratégica {activePillarAnalysis.theme.roman} de V
                                                    </span>
                                                    <h2
                                                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                                                        className="text-2xl md:text-3xl font-semibold text-slate-900 mt-1"
                                                    >
                                                        {activePillarAnalysis.pillar.label}
                                                    </h2>
                                                </div>

                                                <span
                                                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                                                    className="text-4xl font-bold italic text-slate-200 select-none"
                                                >
                                                    {activePillarAnalysis.theme.code}
                                                </span>
                                            </div>

                                            <p className="text-xs text-slate-500 leading-relaxed mb-5">
                                                {activePillarAnalysis.theme.description}
                                            </p>

                                            {/* Bespoke SVG Illustration Centerpiece */}
                                            <div className="my-4 py-4 px-3 rounded-2xl bg-[#FAF9F6] border border-slate-100 flex items-center gap-4">
                                                <PillarIllustrationSVG
                                                    pillarKey={activePillarAnalysis.pillar.key}
                                                    className="w-20 h-20 shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                                                        Cifra / Estado Clave
                                                    </span>
                                                    {activePillarAnalysis.metric ? (
                                                        <p
                                                            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                                                            className={clsx(
                                                                'text-2xl font-bold tracking-tight',
                                                                activePillarAnalysis.theme.lightAccentText
                                                            )}
                                                        >
                                                            {activePillarAnalysis.metric}
                                                        </p>
                                                    ) : (
                                                        <p className="text-sm font-bold text-slate-800">
                                                            {activePillarAnalysis.statusInfo.label}
                                                        </p>
                                                    )}
                                                    <span className="block text-[11px] text-slate-500 mt-0.5">
                                                        {activePillarAnalysis.bullets.length}{' '}
                                                        {activePillarAnalysis.bullets.length === 1
                                                            ? 'hallazgo documentado'
                                                            : 'hallazgos documentados'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Strategic Tags */}
                                            {activePillarAnalysis.tags.length > 0 && (
                                                <div className="mt-4">
                                                    <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                                        Líneas de Impacto
                                                    </span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {activePillarAnalysis.tags.map((tag, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700"
                                                            >
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Quick Pillar Selector */}
                                        <div className="pt-4 mt-4 border-t border-slate-100">
                                            <div className="grid grid-cols-3 gap-1.5">
                                                {pillarAnalytics.map(pa => {
                                                    const isCurrent = pa.slideIndex === step;
                                                    return (
                                                        <button
                                                            key={pa.pillar.key}
                                                            onClick={() => setStep(pa.slideIndex)}
                                                            className={clsx(
                                                                'px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-left truncate border transition-all cursor-pointer',
                                                                isCurrent
                                                                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                                                                    : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100'
                                                            )}
                                                        >
                                                            {pa.theme.roman}. {pa.theme.shortName}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column (8 cols): Clean Editorial Findings List */}
                                    <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/90 shadow-[0_20px_50px_rgba(15,23,42,0.05)] p-7 md:p-9 flex flex-col justify-between min-h-[360px] max-h-[520px]">
                                        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200/80 shrink-0">
                                            <div>
                                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C8102E] block">
                                                    Evidencia & Resultados
                                                </span>
                                                <h3
                                                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                                                    className="text-xl font-semibold text-slate-900"
                                                >
                                                    Detalle Ejecutivo del Pilar
                                                </h3>
                                            </div>
                                            <span
                                                className={clsx(
                                                    'px-3 py-1 rounded-full text-xs font-bold border',
                                                    activePillarAnalysis.statusInfo.lightBadgeClass
                                                )}
                                            >
                                                {activePillarAnalysis.statusInfo.label}
                                            </span>
                                        </div>

                                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                                            {activePillarAnalysis.bullets.length === 0 ? (
                                                <div className="h-full flex flex-col items-center justify-center text-center py-16">
                                                    <MinusCircle size={36} className="text-slate-300 mb-3" />
                                                    <p className="text-base font-semibold text-slate-500">
                                                        Sin información documentada para este pilar.
                                                    </p>
                                                </div>
                                            ) : (
                                                activePillarAnalysis.bullets.map((bulletText, idx) => {
                                                    const itemMetric = extractKeyMetricFromText(bulletText);
                                                    return (
                                                        <div
                                                            key={idx}
                                                            className="p-5 rounded-2xl bg-[#FAF9F6] border border-slate-200/80 hover:border-slate-300 transition-all flex items-start gap-4"
                                                        >
                                                            <div
                                                                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                                                                className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-base font-bold italic text-slate-800 shrink-0"
                                                            >
                                                                {idx + 1}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-base md:text-lg text-slate-800 leading-relaxed">
                                                                    {bulletText}
                                                                </p>
                                                                {itemMetric && (
                                                                    <div className="mt-2.5">
                                                                        <span
                                                                            className={clsx(
                                                                                'inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold border',
                                                                                activePillarAnalysis.theme.lightAccentBg,
                                                                                activePillarAnalysis.theme.lightAccentBorder,
                                                                                activePillarAnalysis.theme.lightAccentText
                                                                            )}
                                                                        >
                                                                            <Sparkles size={12} />
                                                                            Impacto Destacado: {itemMetric}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </main>
            ) : (
                /* ══════════════════════════════════════════════════════════════════════════
                   2B. MAIN SLIDE STAGE — MODO 1 (TECH DARK)
                   ══════════════════════════════════════════════════════════════════════════ */
                <main className="relative z-10 flex-1 min-h-0 overflow-y-auto custom-scrollbar px-6 py-6 md:px-10 md:py-7 flex flex-col justify-center">
                    <div className="w-full max-w-7xl mx-auto h-full flex flex-col justify-center">

                        {/* SLIDE 0: PORTADA TECH DARK */}
                        {step === 0 && (
                            <div className="flex flex-col justify-between gap-6 my-auto animate-in fade-in duration-300">
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
                                                    getStatusBadgeStyleDark(initiative.status)
                                                )}
                                            >
                                                <Rocket size={12} />
                                                {initiative.status || 'Sin Estatus'}
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => setStep(1)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer shadow-sm"
                                        >
                                            <LayoutGrid size={14} />
                                            <span>Ver One-Pager 360°</span>
                                            <ArrowUpRight size={14} />
                                        </button>
                                    </div>

                                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-zinc-50 tracking-tight leading-[1.12] mb-6 max-w-5xl">
                                        {initiative.name}
                                    </h1>

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
                                                    {completedPillarsCount}/5 Pilares
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

                                <div>
                                    <div className="flex items-center justify-between mb-2.5 px-1">
                                        <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                                            SÍNTESIS EJECUTIVA POR PILAR — CLIC EN CUALQUIER TARJETA PARA PROFUNDIZAR
                                        </span>
                                        <span className="text-[11px] font-mono text-zinc-500 tabular-nums">
                                            {substantivePillarsCount} con impacto activo · {5 - completedPillarsCount} pendientes
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
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

                        {/* SLIDE 1: ONE-PAGER 360 TECH DARK */}
                        {step === 1 && (
                            <div className="flex flex-col h-full justify-between gap-4 animate-in fade-in duration-300">
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
                                            <span className="text-zinc-100 font-bold">{completedPillarsCount}/5</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 flex-1 min-h-0">
                                    {pillarAnalytics.map((pa, idx) => {
                                        const Icon = pa.pillar.icon;
                                        const spanClass =
                                            idx < 3
                                                ? 'lg:col-span-2'
                                                : idx === 4
                                                ? 'md:col-span-2 lg:col-span-3'
                                                : 'lg:col-span-3';
                                        return (
                                            <SpotlightCard
                                                key={pa.pillar.key}
                                                glowColor={pa.theme.glowRgba}
                                                className={clsx(
                                                    spanClass,
                                                    'p-5 flex flex-col justify-between min-h-[210px] max-h-[275px]'
                                                )}
                                            >
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

                        {/* SLIDES 2..7: DEEP-DIVE TECH DARK */}
                        {activePillarAnalysis && (
                            <div className="flex flex-col gap-5 my-auto animate-in fade-in duration-300">
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

                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                                    <SpotlightCard
                                        glowColor={activePillarAnalysis.theme.glowRgba}
                                        className="lg:col-span-4 p-6 flex flex-col justify-between gap-6"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-2 mb-4">
                                                <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                                                    PILAR {activePillarAnalysis.theme.code} DE 05
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
            )}

            {/* ─── 3. BOTTOM NAVIGATION DOCK (Adapts to Mode 1 & Mode 2) ──────────────── */}
            <footer
                className={clsx(
                    'relative z-30 px-6 py-3 border-t flex flex-wrap items-center justify-between gap-3 shrink-0 transition-colors',
                    isExecutiveLight
                        ? 'bg-white/95 border-slate-200/90 text-slate-600'
                        : 'bg-zinc-950/90 border-white/[0.08] text-zinc-400 backdrop-blur-md'
                )}
            >
                <div className="hidden lg:flex items-center gap-2 text-xs">
                    <span className="font-medium">Lámina {step + 1} de {totalSlides}</span>
                    <span className="opacity-40">|</span>
                    <span className="opacity-75">Usa las flechas ◀ ▶ para navegar</span>
                </div>

                {/* Slide Selector Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-0.5">
                    <button
                        onClick={() => setStep(0)}
                        className={clsx(
                            'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer',
                            step === 0
                                ? isExecutiveLight
                                    ? 'bg-[#0F172A] text-white shadow-2xs'
                                    : 'bg-zinc-100 text-zinc-950 shadow-sm'
                                : isExecutiveLight
                                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                                : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
                        )}
                    >
                        <span>Portada</span>
                    </button>

                    <button
                        onClick={() => setStep(1)}
                        className={clsx(
                            'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer',
                            step === 1
                                ? isExecutiveLight
                                    ? 'bg-[#0F172A] text-white shadow-2xs'
                                    : 'bg-zinc-100 text-zinc-950 shadow-sm'
                                : isExecutiveLight
                                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                                : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
                        )}
                    >
                        <LayoutGrid size={12} />
                        <span>Vista 360°</span>
                    </button>

                    <div className={clsx('h-4 w-px mx-1 shrink-0', isExecutiveLight ? 'bg-slate-200' : 'bg-zinc-800')} />

                    {pillarAnalytics.map(pa => {
                        const Icon = pa.pillar.icon;
                        const isActive = step === pa.slideIndex;
                        return (
                            <button
                                key={pa.pillar.key}
                                onClick={() => setStep(pa.slideIndex)}
                                className={clsx(
                                    'px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border',
                                    isActive
                                        ? isExecutiveLight
                                            ? clsx(pa.theme.lightAccentBg, pa.theme.lightAccentBorder, pa.theme.lightAccentText)
                                            : clsx(pa.theme.accentBg, pa.theme.accentBorder, pa.theme.accentText)
                                        : isExecutiveLight
                                        ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                                )}
                            >
                                <Icon size={12} />
                                <span className="hidden sm:inline">{pa.theme.shortName}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Prev / Next Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => setStep(s => Math.max(s - 1, 0))}
                        disabled={step === 0}
                        className={clsx(
                            'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer',
                            isExecutiveLight
                                ? 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                                : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white'
                        )}
                    >
                        <ChevronLeft size={14} />
                        <span>Anterior</span>
                    </button>
                    <button
                        onClick={() => setStep(s => Math.min(s + 1, totalSlides - 1))}
                        disabled={step === totalSlides - 1}
                        className={clsx(
                            'inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs',
                            isExecutiveLight ? 'bg-[#0F172A] hover:bg-slate-800' : 'bg-[#E10600] hover:bg-red-600'
                        )}
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
