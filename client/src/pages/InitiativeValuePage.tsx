
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useYear } from '../context/YearContext';
import API_URL from '../config/api';
import {
    Save, TrendingUp, Zap, Users, Sparkles, UserCheck,
    DollarSign, HelpCircle, Award, Presentation, Search, ChevronDown, X as XIcon,
    FileDown, FileSpreadsheet, FileText
} from 'lucide-react';
import { RichTextEditor } from '../components/common/RichTextEditor';
import { OnboardingTour } from '../components/onboarding/OnboardingTour';
import { ValuePresentationModal } from '../components/roadmap/ValuePresentationModal';
import { exportToExcel, exportToPDF, EXPORT_PILLARS } from '../utils/exportValue';
import type { Step } from 'react-joyride';
import { useSearchParams } from 'react-router-dom';

interface Initiative {
    id: string;
    name: string;
    area: string;
    status?: string;
    champion?: string;
    technologies?: string[];
    progress?: number;
}

interface ValueData {
    business_value: string;
    operational_efficiency: string;
    fte_detail: string;
    qualitative_benefit: string;
    users_reached_detail: string;
    estimated_savings_detail: string;
}

const EMPTY_VALUE: ValueData = {
    business_value: '',
    operational_efficiency: '',
    fte_detail: '',
    qualitative_benefit: '',
    users_reached_detail: '',
    estimated_savings_detail: '',
};

// Pillar configuration in display order
const PILLARS = [
    {
        key: 'business_value' as keyof ValueData,
        label: 'Valor de Negocio',
        icon: TrendingUp,
        gradient: 'from-violet-50 to-white dark:from-violet-950/40 dark:to-[#1E2630]',
        borderColor: 'border-violet-100 dark:border-violet-900/50',
        iconBg: 'bg-violet-100 dark:bg-violet-900/50',
        iconColor: 'text-violet-600 dark:text-violet-400',
        accentRing: 'ring-violet-50 dark:ring-violet-900/20',
        placeholder: '• Impacto directo en ingresos o ventas...\n• Ventaja competitiva generada...\n• Alineación con objetivos estratégicos...',
    },
    {
        key: 'operational_efficiency' as keyof ValueData,
        label: 'Eficiencia Operativa',
        icon: Zap,
        gradient: 'from-amber-50 to-white dark:from-amber-950/40 dark:to-[#1E2630]',
        borderColor: 'border-amber-100 dark:border-amber-900/50',
        iconBg: 'bg-amber-100 dark:bg-amber-900/50',
        iconColor: 'text-amber-600 dark:text-amber-400',
        accentRing: 'ring-amber-50 dark:ring-amber-900/20',
        placeholder: '• Procesos automatizados o eliminados...\n• Reducción de tiempos de ciclo...\n• Mejora en SLAs...',
    },
    {
        key: 'fte_detail' as keyof ValueData,
        label: 'FTE',
        icon: Users,
        gradient: 'from-cyan-50 to-white dark:from-cyan-950/40 dark:to-[#1E2630]',
        borderColor: 'border-cyan-100 dark:border-cyan-900/50',
        iconBg: 'bg-cyan-100 dark:bg-cyan-900/50',
        iconColor: 'text-cyan-600 dark:text-cyan-400',
        accentRing: 'ring-cyan-50 dark:ring-cyan-900/20',
        placeholder: '• FTEs liberados o reasignados...\n• Horas-hombre ahorradas por semana...\n• Equipos beneficiados...',
    },
    {
        key: 'qualitative_benefit' as keyof ValueData,
        label: 'Beneficio Cualitativo',
        icon: Sparkles,
        gradient: 'from-rose-50 to-white dark:from-rose-950/40 dark:to-[#1E2630]',
        borderColor: 'border-rose-100 dark:border-rose-900/50',
        iconBg: 'bg-rose-100 dark:bg-rose-900/50',
        iconColor: 'text-rose-600 dark:text-rose-400',
        accentRing: 'ring-rose-50 dark:ring-rose-900/20',
        placeholder: '• Mejora en experiencia de usuario...\n• Mayor visibilidad y transparencia...\n• Reducción de errores humanos...',
    },
    {
        key: 'users_reached_detail' as keyof ValueData,
        label: 'Usuarios Alcanzados',
        icon: UserCheck,
        gradient: 'from-emerald-50 to-white dark:from-emerald-950/40 dark:to-[#1E2630]',
        borderColor: 'border-emerald-100 dark:border-emerald-900/50',
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        accentRing: 'ring-emerald-50 dark:ring-emerald-900/20',
        placeholder: '• Número de usuarios internos impactados...\n• Áreas y roles beneficiados...\n• Alcance geográfico...',
    },
    {
        key: 'estimated_savings_detail' as keyof ValueData,
        label: 'Ahorro Estimado',
        icon: DollarSign,
        gradient: 'from-green-50 to-white dark:from-green-950/40 dark:to-[#1E2630]',
        borderColor: 'border-green-100 dark:border-green-900/50',
        iconBg: 'bg-green-100 dark:bg-green-900/50',
        iconColor: 'text-green-600 dark:text-green-400',
        accentRing: 'ring-green-50 dark:ring-green-900/20',
        placeholder: '• Ahorro anual estimado en USD...\n• Costos de licenciamiento eliminados...\n• ROI proyectado...',
    },
];

export const InitiativeValuePage = () => {
    const { user, token } = useAuth();
    const { isPresentationMode } = useTheme();
    const { year } = useYear();
    const [runTour, setRunTour] = useState<boolean | undefined>(undefined);

    const isAdminOrEditor = user?.role === 'admin' || user?.role === 'editor';
    // In presentation mode, even editors see read-only
    const canEdit = isAdminOrEditor && !isPresentationMode;

    const tourSteps: Step[] = isAdminOrEditor ? [
        {
            target: '.tour-iv-header',
            content: 'Bienvenido a Impacto & Valor. Aquí puedes documentar el valor y beneficio de cada iniciativa.',
            disableBeacon: true,
        },
        {
            target: '.tour-iv-selectors',
            content: 'Selecciona el área y la iniciativa para cargar o editar su detalle de valor.',
        },
        {
            target: '.tour-iv-pillars',
            content: 'Cada pilar representa una dimensión de valor. Utiliza el editor de texto enriquecido para detallar el impacto.',
        },
        {
            target: '.tour-iv-save',
            content: 'No olvides guardar tus cambios al terminar de editar.',
        },
    ] : [
        {
            target: '.tour-iv-header',
            content: 'Bienvenido a Impacto & Valor. Aquí puedes consultar el valor y beneficio de cada iniciativa.',
            disableBeacon: true,
        },
        {
            target: '.tour-iv-selectors',
            content: 'Usa los selectores para navegar entre las diferentes iniciativas.',
        },
        {
            target: '.tour-iv-pillars',
            content: 'Cada pilar muestra una dimensión del valor aportado por la iniciativa.',
        },
    ];

    // State
    const [initiatives, setInitiatives] = useState<Initiative[]>([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const initIdFromUrl = searchParams.get('initiative_id');
    const [selectedInitiativeId, setSelectedInitiativeId] = useState<string>(initIdFromUrl || '');

    // Clear the URL param once it's loaded to avoid getting stuck if user changes selection
    useEffect(() => {
        if (initIdFromUrl && initiatives.length > 0) {
            // Remove it from URL so subsequent clicks in the sidebar don't force it
            setSearchParams({});
        }
    }, [initIdFromUrl, initiatives, setSearchParams]);
    const [selectedArea, setSelectedArea] = useState<string>('');
    const [valueData, setValueData] = useState<ValueData>({ ...EMPTY_VALUE });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showPresentation, setShowPresentation] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);

    // Combobox state
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isComboOpen, setIsComboOpen] = useState(false);

    // Pillar summary map  { initiative_id: filledCount }
    const [pillarSummary, setPillarSummary] = useState<Record<string, number>>({});

    // Derived
    const uniqueAreas = useMemo(() => {
        const areas = initiatives.map(i => i.area).filter(Boolean);
        return Array.from(new Set(areas)).sort();
    }, [initiatives]);

    const filteredInitiatives = useMemo(() => {
        if (!selectedArea) return initiatives;
        return initiatives.filter(i => i.area === selectedArea);
    }, [initiatives, selectedArea]);

    const selectedInitiative = useMemo(
        () => initiatives.find(i => i.id === selectedInitiativeId),
        [initiatives, selectedInitiativeId]
    );

    // Fetch Initiatives + Pillar Summary
    useEffect(() => {
        const fetchInitiatives = async () => {
            try {
                const [initRes, summaryRes] = await Promise.all([
                    fetch(`${API_URL}/api/initiatives?year=${year}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    fetch(`${API_URL}/api/initiative-value/summary`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);
                const data = await initRes.json();
                const sorted = Array.isArray(data)
                    ? data.sort((a: any, b: any) => a.name.localeCompare(b.name))
                    : [];
                setInitiatives(sorted);

                if (summaryRes.ok) {
                    const summaryData = await summaryRes.json();
                    setPillarSummary(summaryData || {});
                }
            } catch (e) {
                console.error(e);
            }
        };
        if (token) fetchInitiatives();
    }, [token, year]);

    // Fetch Value Data when initiative changes
    useEffect(() => {
        const fetchValue = async () => {
            if (!selectedInitiativeId) {
                setValueData({ ...EMPTY_VALUE });
                return;
            }

            setLoading(true);
            setValueData({ ...EMPTY_VALUE });

            try {
                const res = await fetch(
                    `${API_URL}/api/initiative-value?initiative_id=${selectedInitiativeId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (!res.ok) throw new Error(`API Error: ${res.status}`);

                const data = await res.json();
                if (data) {
                    setValueData({
                        business_value: data.business_value || '',
                        operational_efficiency: data.operational_efficiency || '',
                        fte_detail: data.fte_detail || '',
                        qualitative_benefit: data.qualitative_benefit || '',
                        users_reached_detail: data.users_reached_detail || '',
                        estimated_savings_detail: data.estimated_savings_detail || '',
                    });
                }
            } catch (e) {
                console.error('Error fetching value data:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchValue();
    }, [selectedInitiativeId, token]);

    // Re-fetch summary after save so badges stay fresh
    const refreshSummary = async () => {
        try {
            const res = await fetch(`${API_URL}/api/initiative-value/summary`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setPillarSummary(await res.json());
        } catch (e) {
            console.error(e);
        }
    };

    // Save
    const handleSave = async () => {
        if (!selectedInitiativeId) return;
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch(`${API_URL}/api/initiative-value`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    initiative_id: selectedInitiativeId,
                    ...valueData,
                }),
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Datos guardados exitosamente' });
                setTimeout(() => setMessage(null), 3000);
                // Update local summary optimistically with current filledCount
                setPillarSummary(prev => ({ ...prev, [selectedInitiativeId]: filledCount }));
                refreshSummary();
            } else {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Error desconocido');
            }
        } catch (e: any) {
            setMessage({ type: 'error', text: `Error al guardar: ${e.message || 'Error de conexión'}` });
        } finally {
            setSaving(false);
        }
    };

    // Status Color Helper
    const getStatusColor = (status?: string) => {
        if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
        const s = status.toLowerCase();
        if (s.includes('retrasado') || s.includes('cancelado'))
            return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
        if (s.includes('en curso') || s.includes('avance'))
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
        if (s.includes('entregado'))
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    };

    // Combobox: filtered list based on search + area
    const comboOptions = useMemo(() => {
        const areaFiltered = selectedArea
            ? filteredInitiatives
            : initiatives;
        if (!searchQuery.trim()) return areaFiltered;
        const q = searchQuery.toLowerCase();
        return areaFiltered.filter(i => i.name.toLowerCase().includes(q));
    }, [initiatives, filteredInitiatives, selectedArea, searchQuery]);

    // Combobox: select an initiative
    const handleSelectInitiative = (id: string, name: string) => {
        setSelectedInitiativeId(id);
        setSearchQuery(name);
        setIsComboOpen(false);
    };

    // Combobox: clear
    const handleClearInitiative = () => {
        setSelectedInitiativeId('');
        setSearchQuery('');
        setIsComboOpen(false);
    };

    // Global summary stats
    const globalStats = useMemo(() => {
        const total = initiatives.length;
        const complete = initiatives.filter(i => (pillarSummary[i.id] ?? 0) === PILLARS.length).length;
        const partial = initiatives.filter(i => {
            const c = pillarSummary[i.id] ?? 0;
            return c > 0 && c < PILLARS.length;
        }).length;
        const empty = total - complete - partial;
        return { total, complete, partial, empty };
    }, [initiatives, pillarSummary]);

    // Helper: count filled pillars
    const filledCount = useMemo(() => {
        return PILLARS.filter(p => {
            const v = valueData[p.key];
            return v && v !== '' && v !== '<p></p>';
        }).length;
    }, [valueData]);

    return (
        <div className="flex flex-col h-full space-y-4 p-2">
            <OnboardingTour
                steps={tourSteps}
                tourKey={`impactValueTourCompleted_${user?.role || 'user'}`}
                runTour={runTour}
            />

            {/* Header / Selectors */}
            <div className="bg-white dark:bg-[#1E2630] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col gap-4 tour-iv-header">
                {/* Row 1: Title + Selectors + Actions */}
                <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between tour-iv-selectors">
                    <div className="flex flex-col md:flex-row gap-4 w-full items-end">
                        {/* Section Icon + Title */}
                        <div className="hidden md:flex items-center gap-3 pr-4 border-r border-gray-200 dark:border-gray-700 mr-2 self-center">
                            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
                                <Award size={20} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-sm font-extrabold text-gray-800 dark:text-gray-100 uppercase tracking-wide leading-tight">
                                    Impacto
                                </h2>
                                <h2 className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide leading-tight">
                                    & Valor
                                </h2>
                            </div>
                        </div>

                        {/* Area Selector */}
                        <div className="w-48">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Área</label>
                            <select
                                value={selectedArea}
                                onChange={(e) => {
                                    setSelectedArea(e.target.value);
                                    setSelectedInitiativeId('');
                                }}
                                className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#111827] text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Todas las Áreas</option>
                                {uniqueAreas.map(area => (
                                    <option key={area} value={area}>{area}</option>
                                ))}
                            </select>
                        </div>

                        {/* Initiative Combobox Search */}
                        <div className="flex-1 relative">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Iniciativa</label>
                            <div className="relative">
                                {/* Search input */}
                                <div className="relative flex items-center">
                                    <Search size={15} className="absolute left-2.5 text-gray-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setIsComboOpen(true);
                                            if (!e.target.value) setSelectedInitiativeId('');
                                        }}
                                        onFocus={() => setIsComboOpen(true)}
                                        onBlur={() => setTimeout(() => setIsComboOpen(false), 150)}
                                        placeholder="Buscar iniciativa..."
                                        disabled={loading}
                                        className="w-full pl-8 pr-8 py-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#111827] text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm disabled:opacity-50"
                                    />
                                    {searchQuery ? (
                                        <button
                                            onClick={handleClearInitiative}
                                            className="absolute right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                        >
                                            <XIcon size={14} />
                                        </button>
                                    ) : (
                                        <ChevronDown size={14} className="absolute right-2.5 text-gray-400 pointer-events-none" />
                                    )}
                                </div>

                                {/* Dropdown list */}
                                {isComboOpen && (
                                    <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white dark:bg-[#1E2630] border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                        {comboOptions.length === 0 ? (
                                            <div className="px-3 py-2 text-xs text-gray-400 italic">Sin resultados</div>
                                        ) : (
                                            comboOptions.map(i => {
                                                const filled = pillarSummary[i.id] ?? 0;
                                                const isSelected = i.id === selectedInitiativeId;
                                                const badgeColor =
                                                    filled === PILLARS.length
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                        : filled > 0
                                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400';
                                                return (
                                                    <button
                                                        key={i.id}
                                                        onMouseDown={() => handleSelectInitiative(i.id, i.name)}
                                                        className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-sm ${
                                                            isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20 font-semibold' : ''
                                                        }`}
                                                    >
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="truncate text-gray-800 dark:text-gray-100">{i.name}</span>
                                                            {i.area && (
                                                                <span className="text-xs text-gray-400 truncate">{i.area}</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                                            {/* mini dot bar */}
                                                            <div className="flex gap-0.5">
                                                                {PILLARS.map((_, idx) => (
                                                                    <div
                                                                        key={idx}
                                                                        className={`w-1.5 h-1.5 rounded-full ${
                                                                            idx < filled ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'
                                                                        }`}
                                                                    />
                                                                ))}
                                                            </div>
                                                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${badgeColor}`}>
                                                                {filled}/{PILLARS.length}
                                                            </span>
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                        {/* Completion Badge */}
                        {selectedInitiativeId && (
                            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="flex gap-0.5">
                                    {PILLARS.map((p, i) => {
                                        const filled = valueData[p.key] && valueData[p.key] !== '' && valueData[p.key] !== '<p></p>';
                                        return (
                                            <div
                                                key={i}
                                                className={`w-2 h-2 rounded-full transition-colors ${filled ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                                                title={`${p.label}: ${filled ? 'Completado' : 'Pendiente'}`}
                                            />
                                        );
                                    })}
                                </div>
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-1">
                                    {filledCount}/{PILLARS.length}
                                </span>
                            </div>
                        )}

                        {/* Help Button */}
                        <button
                            onClick={() => {
                                localStorage.removeItem(`impactValueTourCompleted_${user?.role || 'user'}`);
                                setRunTour(true);
                            }}
                            className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            title="Repetir recorrido"
                        >
                            <HelpCircle size={24} />
                        </button>

                        {/* Preview Button */}
                        {selectedInitiativeId && (
                            <button
                                onClick={() => setShowPresentation(true)}
                                className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-[#1E2630] text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-200 dark:border-indigo-900/50 shadow-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all font-bold text-xs"
                                title="Vista Previa de Presentación"
                            >
                                <Presentation size={18} />
                                <span>Vista Previa</span>
                            </button>
                        )}

                        {/* Export Dropdown */}
                        {selectedInitiativeId && selectedInitiative && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowExportMenu(prev => !prev)}
                                    onBlur={() => setTimeout(() => setShowExportMenu(false), 150)}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#1E2630] text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-900/50 shadow-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all font-bold text-xs whitespace-nowrap"
                                    title="Exportar iniciativa"
                                >
                                    <FileDown size={18} />
                                    <span>Exportar</span>
                                    <ChevronDown size={13} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                                </button>

                                {showExportMenu && (
                                    <div className="absolute right-0 top-full mt-1.5 z-50 w-52 bg-white dark:bg-[#1E2630] border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden">
                                        {/* Header */}
                                        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-700">
                                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Formato de exportación</p>
                                        </div>

                                        {/* Excel option */}
                                        <button
                                            onMouseDown={() => {
                                                setShowExportMenu(false);
                                                exportToExcel(
                                                    {
                                                        name: selectedInitiative.name,
                                                        area: selectedInitiative.area,
                                                        champion: selectedInitiative.champion,
                                                        status: selectedInitiative.status,
                                                        progress: selectedInitiative.progress,
                                                        technologies: selectedInitiative.technologies,
                                                    },
                                                    valueData as unknown as Record<string, string>,
                                                    EXPORT_PILLARS
                                                );
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors group"
                                        >
                                            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/60 transition-colors">
                                                <FileSpreadsheet size={16} className="text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Excel (.xlsx)</p>
                                                <p className="text-xs text-gray-400">2 hojas · Resumen + Detalle</p>
                                            </div>
                                        </button>

                                        {/* Divider */}
                                        <div className="h-px bg-gray-100 dark:bg-gray-700 mx-3" />

                                        {/* PDF option */}
                                        <button
                                            onMouseDown={() => {
                                                setShowExportMenu(false);
                                                exportToPDF(
                                                    {
                                                        name: selectedInitiative.name,
                                                        area: selectedInitiative.area,
                                                        champion: selectedInitiative.champion,
                                                        status: selectedInitiative.status,
                                                        progress: selectedInitiative.progress,
                                                        technologies: selectedInitiative.technologies,
                                                    },
                                                    valueData as unknown as Record<string, string>,
                                                    EXPORT_PILLARS
                                                );
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors group"
                                        >
                                            <div className="p-1.5 bg-rose-100 dark:bg-rose-900/40 rounded-lg group-hover:bg-rose-200 dark:group-hover:bg-rose-900/60 transition-colors">
                                                <FileText size={16} className="text-rose-600 dark:text-rose-400" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">PDF (.pdf)</p>
                                                <p className="text-xs text-gray-400">Portada + 1 página por pilar</p>
                                            </div>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Save Button */}
                        {canEdit && (
                            <button
                                onClick={handleSave}
                                disabled={saving || !selectedInitiativeId}
                                className="tour-iv-save flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-[#E10600] to-red-800 hover:from-red-600 hover:to-red-900 text-white rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 h-fit whitespace-nowrap transform hover:-translate-y-0.5 active:translate-y-0"
                            >
                                <Save size={18} />
                                <span>{saving ? 'Guardando...' : 'Guardar'}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Presentation Modal */}
                {selectedInitiative && (
                    <ValuePresentationModal 
                        isOpen={showPresentation}
                        onClose={() => setShowPresentation(false)}
                        initiative={{
                            name: selectedInitiative.name,
                            area: selectedInitiative.area,
                            champion: selectedInitiative.champion,
                            status: selectedInitiative.status
                        }}
                        data={valueData}
                        pillars={PILLARS}
                    />
                )}

                {/* Row 2: Metadata Badges */}
                {selectedInitiative && (
                    <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(selectedInitiative.status)}`}>
                            {selectedInitiative.status || 'Sin Estatus'}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-bold">Champion:</span>
                            <span className="text-gray-700 dark:text-gray-200">{selectedInitiative.champion || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-bold">Área:</span>
                            <span className="text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                                {selectedInitiative.area}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-bold">Tecnología:</span>
                            <span className="text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                                {selectedInitiative.technologies && selectedInitiative.technologies.length > 0
                                    ? selectedInitiative.technologies.join(', ')
                                    : 'N/A'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-bold">Progreso:</span>
                            <div className="flex items-center gap-1">
                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                                        style={{ width: `${selectedInitiative.progress || 0}%` }}
                                    />
                                </div>
                                <span className="text-gray-700 dark:text-gray-200 font-medium">
                                    {selectedInitiative.progress || 0}%
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Notification */}
            {message && (
                <div
                    className={`p-3 rounded-lg text-sm font-bold text-center transition-all ${
                        message.type === 'success'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    }`}
                >
                    {message.text}
                </div>
            )}

            {/* Empty State + Global Summary */}
            {!selectedInitiativeId && !loading && (
                <div className="flex-1 flex flex-col items-center justify-center gap-6">
                    {/* Hero */}
                    <div className="text-center max-w-md">
                        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/10">
                            <Award size={36} className="text-indigo-500 dark:text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-2">
                            Impacto & Valor
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                            Selecciona una iniciativa para visualizar y{' '}
                            {isAdminOrEditor ? 'editar' : 'consultar'} su detalle de valor
                            a través de los 6 pilares de impacto.
                        </p>
                    </div>

                    {/* Global pillar completion summary */}
                    {globalStats.total > 0 && (
                        <div className="w-full max-w-2xl">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center mb-3">Resumen global de iniciativas</p>
                            <div className="grid grid-cols-3 gap-3">
                                {/* Complete */}
                                <div className="flex flex-col items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-4">
                                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{globalStats.complete}</span>
                                    <div className="flex gap-0.5 mb-0.5">
                                        {PILLARS.map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-emerald-400" />)}
                                    </div>
                                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 text-center leading-tight">6/6 pilares completos</span>
                                    <span className="text-xs text-gray-400">iniciativas</span>
                                </div>
                                {/* Partial */}
                                <div className="flex flex-col items-center gap-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/40 rounded-xl p-4">
                                    <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{globalStats.partial}</span>
                                    <div className="flex gap-0.5 mb-0.5">
                                        {PILLARS.map((_, i) => <div key={i} className={`w-2 h-2 rounded-full ${i < 3 ? 'bg-amber-400' : 'bg-gray-300 dark:bg-gray-600'}`} />)}
                                    </div>
                                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 text-center leading-tight">1–5/6 pilares</span>
                                    <span className="text-xs text-gray-400">en progreso</span>
                                </div>
                                {/* Empty */}
                                <div className="flex flex-col items-center gap-1 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
                                    <span className="text-2xl font-black text-gray-400">{globalStats.empty}</span>
                                    <div className="flex gap-0.5 mb-0.5">
                                        {PILLARS.map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />)}
                                    </div>
                                    <span className="text-xs font-semibold text-gray-400 text-center leading-tight">0/6 sin documentar</span>
                                    <span className="text-xs text-gray-400">pendientes</span>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="mt-4">
                                <div className="flex justify-between text-xs text-gray-400 mb-1">
                                    <span>{globalStats.complete} completas de {globalStats.total}</span>
                                    <span>{Math.round((globalStats.complete / globalStats.total) * 100)}% completado</span>
                                </div>
                                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-700"
                                        style={{ width: `${(globalStats.complete / globalStats.total) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
                        <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
                            Cargando datos de valor...
                        </p>
                    </div>
                </div>
            )}

            {/* Pillars Grid */}
            {selectedInitiativeId && !loading && (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 min-h-0 tour-iv-pillars">
                    {PILLARS.map((pillar) => {
                        const Icon = pillar.icon;
                        return (
                            <div
                                key={pillar.key}
                                className={`bg-white dark:bg-[#1E2630] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 
                                    flex flex-col overflow-hidden transition-all hover:shadow-md ring-1 ${pillar.accentRing}
                                    min-h-[280px] max-h-[400px]`}
                            >
                                {/* Pillar Header */}
                                <div className={`px-4 py-3 bg-gradient-to-r ${pillar.gradient} border-b ${pillar.borderColor} flex items-center gap-2 flex-shrink-0`}>
                                    <div className={`p-1.5 ${pillar.iconBg} rounded-lg ${pillar.iconColor}`}>
                                        <Icon size={18} />
                                    </div>
                                    <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm uppercase tracking-wide">
                                        {pillar.label}
                                    </h3>
                                </div>

                                {/* Pillar Editor */}
                                <div className="flex-1 p-0 flex flex-col min-h-0 overflow-hidden">
                                    <RichTextEditor
                                        value={valueData[pillar.key]}
                                        onChange={(val) =>
                                            setValueData(prev => ({ ...prev, [pillar.key]: val }))
                                        }
                                        readOnly={!canEdit}
                                        placeholder={
                                            canEdit
                                                ? pillar.placeholder
                                                : 'Sin información disponible'
                                        }
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
