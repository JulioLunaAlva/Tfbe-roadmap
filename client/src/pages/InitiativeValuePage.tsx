
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useYear } from '../context/YearContext';
import API_URL from '../config/api';
import {
    Save, TrendingUp, Zap, Users, Sparkles, UserCheck,
    DollarSign, HelpCircle, Award
} from 'lucide-react';
import { RichTextEditor } from '../components/common/RichTextEditor';
import { OnboardingTour } from '../components/onboarding/OnboardingTour';
import type { Step } from 'react-joyride';

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
    const [selectedInitiativeId, setSelectedInitiativeId] = useState<string>('');
    const [selectedArea, setSelectedArea] = useState<string>('');
    const [valueData, setValueData] = useState<ValueData>({ ...EMPTY_VALUE });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

    // Fetch Initiatives
    useEffect(() => {
        const fetchInitiatives = async () => {
            try {
                const res = await fetch(`${API_URL}/api/initiatives?year=${year}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                const sorted = Array.isArray(data)
                    ? data.sort((a: any, b: any) => a.name.localeCompare(b.name))
                    : [];
                setInitiatives(sorted);
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

                        {/* Initiative Selector */}
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Iniciativa</label>
                            <div className="relative group">
                                <select
                                    value={selectedInitiativeId}
                                    onChange={(e) => setSelectedInitiativeId(e.target.value)}
                                    className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#111827] text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                                    disabled={loading}
                                >
                                    <option value="">Seleccionar Iniciativa...</option>
                                    {filteredInitiatives.map(i => (
                                        <option key={i.id} value={i.id}>{i.name}</option>
                                    ))}
                                </select>
                                {!selectedInitiativeId && (
                                    <div className="absolute top-10 left-0 bg-black text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none whitespace-nowrap">
                                        Selecciona una iniciativa para ver su detalle de valor
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

            {/* Empty State */}
            {!selectedInitiativeId && !loading && (
                <div className="flex-1 flex items-center justify-center">
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
