
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useYear } from '../context/YearContext';
import { CALENDAR_SCHEMA, getCurrentWeekNumber } from '../utils/calendarConstants';
import API_URL from '../config/api';
import { Save, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

interface OnePagerData {
    id?: string;
    main_progress: string;
    next_steps: string;
    stoppers_risks: string;
}

interface Initiative {
    id: string;
    name: string;
    area: string;
    status?: string;
    champion?: string;
}

export const OnePagerPage = () => {
    const { user, token } = useAuth();
    const { year, setYear } = useYear();

    // Selectors
    const [initiatives, setInitiatives] = useState<Initiative[]>([]);
    const [selectedInitiativeId, setSelectedInitiativeId] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(0);
    const [selectedArea, setSelectedArea] = useState<string>('');

    // Derived Data
    const uniqueAreas = useMemo(() => {
        const areas = initiatives.map(i => i.area).filter(Boolean);
        return Array.from(new Set(areas)).sort();
    }, [initiatives]);

    const filteredInitiatives = useMemo(() => {
        if (!selectedArea) return initiatives;
        return initiatives.filter(i => i.area === selectedArea);
    }, [initiatives, selectedArea]);

    // Find selected initiative object
    const selectedInitiative = useMemo(() =>
        initiatives.find(i => i.id === selectedInitiativeId),
        [initiatives, selectedInitiativeId]);

    // Data
    const [report, setReport] = useState<OnePagerData>({
        main_progress: '',
        next_steps: '',
        stoppers_risks: ''
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Initial Load - Initiatives & Current Date
    useEffect(() => {
        const fetchInitiatives = async () => {
            try {
                const res = await fetch(`${API_URL}/api/initiatives?year=${year}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                const sorted = Array.isArray(data) ? data.sort((a: any, b: any) => a.name.localeCompare(b.name)) : [];
                setInitiatives(sorted);
                // Default selection REMOVED as requested
            } catch (e) {
                console.error(e);
            }
        };

        if (token) fetchInitiatives();
    }, [token, year]);

    // Set Default Month/Week based on current date
    useEffect(() => {
        const currentIsoWeek = getCurrentWeekNumber();
        // Find which month contains this week
        for (const q of CALENDAR_SCHEMA) {
            for (const m of q.months) {
                const idx = m.weeks.indexOf(currentIsoWeek);
                if (idx !== -1) {
                    setSelectedMonth(m.name);
                    setSelectedWeekIndex(idx);
                    return;
                }
            }
        }
        // Fallback
        setSelectedMonth('Ene');
        setSelectedWeekIndex(0);
    }, []);

    // Calculate ISO Week from selection
    const currentIsoWeek = useMemo(() => {
        if (!selectedMonth) return 1;
        for (const q of CALENDAR_SCHEMA) {
            const m = q.months.find(mon => mon.name === selectedMonth);
            if (m) {
                return m.weeks[selectedWeekIndex] || m.weeks[0];
            }
        }
        return 1;
    }, [selectedMonth, selectedWeekIndex]);

    // Fetch Report content when selection changes
    useEffect(() => {
        const fetchReport = async () => {
            if (!selectedInitiativeId || !currentIsoWeek) {
                // Clear report if no selection
                setReport({ main_progress: '', next_steps: '', stoppers_risks: '' });
                return;
            }

            setLoading(true);
            setReport({ main_progress: '', next_steps: '', stoppers_risks: '' }); // Reset immediately to avoid stale data

            try {
                const res = await fetch(`${API_URL}/api/one-pagers?initiative_id=${selectedInitiativeId}&year=${year}&week_number=${currentIsoWeek}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!res.ok) {
                    throw new Error(`API Error: ${res.status}`);
                }

                const data = await res.json();
                if (data) {
                    setReport({
                        main_progress: data.main_progress || '',
                        next_steps: data.next_steps || '',
                        stoppers_risks: data.stoppers_risks || ''
                    });
                } else {
                    // Already reset, but good to be explicit
                    setReport({ main_progress: '', next_steps: '', stoppers_risks: '' });
                }
            } catch (e) {
                console.error("Error fetching report:", e);
                // Report is already reset, so user sees empty fields instead of old data
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, [selectedInitiativeId, currentIsoWeek, year, token]);

    const handleSave = async () => {
        if (!selectedInitiativeId) return;
        setSaving(true);
        setMessage(null); // Clear previous messages
        try {
            const res = await fetch(`${API_URL}/api/one-pagers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    initiative_id: selectedInitiativeId,
                    year,
                    week_number: currentIsoWeek,
                    ...report
                })
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Reporte guardado exitosamente' });
                setTimeout(() => setMessage(null), 3000);
            } else {
                // Try to get error details
                const errData = await res.json().catch(() => ({}));
                const errMsg = errData.error || errData.details || 'Error desconocido en el servidor';
                throw new Error(errMsg);
            }
        } catch (e: any) {
            console.error("Save error:", e);
            setMessage({ type: 'error', text: `Error al guardar: ${e.message || 'Error de conexión'}` });
        } finally {
            setSaving(false);
        }
    };

    // Helper to get weeks count for selected month
    const weeksInMonth = useMemo(() => {
        for (const q of CALENDAR_SCHEMA) {
            const m = q.months.find(mon => mon.name === selectedMonth);
            if (m) return m.weeks.length;
        }
        return 4;
    }, [selectedMonth]);

    // Helper for Status Color
    const getStatusColor = (status?: string) => {
        if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
        const s = status.toLowerCase();
        if (s.includes('retrasado') || s.includes('cancelado')) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
        if (s.includes('en curso') || s.includes('avance')) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
        if (s.includes('entregado')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    };

    const canEdit = user?.role === 'admin' || user?.role === 'editor';

    return (
        <div className="flex flex-col h-full space-y-4 p-2">
            {/* Header / Selectors */}
            <div className="bg-white dark:bg-[#1E2630] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col gap-4">

                {/* Row 1: Selectors & Actions */}
                <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
                    <div className="flex flex-col md:flex-row gap-4 w-full">

                        {/* Area Selector */}
                        <div className="w-48">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Área</label>
                            <select
                                value={selectedArea}
                                onChange={(e) => {
                                    setSelectedArea(e.target.value);
                                    setSelectedInitiativeId(''); // Reset initiative on area change
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
                                        Selecciona una iniciativa para ver el reporte
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Week Selector */}
                        <div className="w-32">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Semana</label>
                            <select
                                value={selectedWeekIndex}
                                onChange={(e) => setSelectedWeekIndex(Number(e.target.value))}
                                className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#111827] text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            >
                                {Array.from({ length: weeksInMonth }).map((_, i) => (
                                    <option key={i} value={i}>Semana {i + 1}</option>
                                ))}
                            </select>
                        </div>

                        {/* Month Selector */}
                        <div className="w-40">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mes</label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => {
                                    setSelectedMonth(e.target.value);
                                    setSelectedWeekIndex(0); // Reset week on month change
                                }}
                                className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#111827] text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            >
                                {CALENDAR_SCHEMA.flatMap(q => q.months).map(m => (
                                    <option key={m.name} value={m.name}>{m.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Year Selector */}
                        <div className="w-32">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Año</label>
                            <select
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#111827] text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value={2024}>2024</option>
                                <option value={2025}>2025</option>
                                <option value={2026}>2026</option>
                            </select>
                        </div>
                    </div>

                    {/* RED Save Button */}
                    {canEdit && (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-[#E10600] to-red-800 hover:from-red-600 hover:to-red-900 text-white rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 h-fit whitespace-nowrap transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <Save size={18} />
                            <span>{saving ? 'Guardando...' : 'Guardar'}</span>
                        </button>
                    )}
                </div>

                {/* Row 2: Metadata Badges (Status, Champion, Area) */}
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
                    </div>
                )}
            </div>

            {/* Notification */}
            {message && (
                <div className={`p-3 rounded-lg text-sm font-bold text-center ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col gap-4 min-h-0">
                    {/* Top Row: Progress & Next Steps (Takes most space) */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
                        {/* Progress */}
                        <div className="bg-white dark:bg-[#1E2630] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden transition-all hover:shadow-md">
                            <div className="px-4 py-3 bg-gradient-to-r from-emerald-50 to-white dark:from-[#064E3B] dark:to-[#1E2630] border-b border-emerald-100 dark:border-emerald-900/50 flex items-center gap-2">
                                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 size={18} />
                                </div>
                                <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm uppercase tracking-wide">
                                    Principales Avances
                                </h3>
                            </div>
                            <div className="flex-1 p-0">
                                <textarea
                                    value={report.main_progress}
                                    onChange={(e) => setReport({ ...report, main_progress: e.target.value })}
                                    readOnly={!canEdit}
                                    placeholder={canEdit ? "• Logro clave alcanzado...\n• Hito completado..." : "Sin información disponible"}
                                    className="w-full h-full p-4 bg-transparent text-gray-700 dark:text-gray-300 resize-none border-none focus:ring-0 placeholder-gray-400 dark:placeholder-gray-600 text-sm leading-relaxed"
                                />
                            </div>
                        </div>

                        {/* Next Steps */}
                        <div className="bg-white dark:bg-[#1E2630] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden transition-all hover:shadow-md">
                            <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-white dark:from-[#1E3A8A] dark:to-[#1E2630] border-b border-blue-100 dark:border-blue-900/50 flex items-center gap-2">
                                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                                    <ArrowRight size={18} />
                                </div>
                                <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm uppercase tracking-wide">
                                    Siguientes Pasos / Compromisos
                                </h3>
                            </div>
                            <div className="flex-1 p-0">
                                <textarea
                                    value={report.next_steps}
                                    onChange={(e) => setReport({ ...report, next_steps: e.target.value })}
                                    readOnly={!canEdit}
                                    placeholder={canEdit ? "• Próxima reunión de seguimiento...\n• Entregable pendiente..." : "Sin información disponible"}
                                    className="w-full h-full p-4 bg-transparent text-gray-700 dark:text-gray-300 resize-none border-none focus:ring-0 placeholder-gray-400 dark:placeholder-gray-600 text-sm leading-relaxed"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row: Stoppers/Risks (Fixed smaller height) */}
                    <div className="h-48 flex-shrink-0 bg-white dark:bg-[#1E2630] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden transition-all hover:shadow-md ring-1 ring-red-50 dark:ring-red-900/20">
                        <div className="px-4 py-2 bg-gradient-to-r from-red-50 to-white dark:from-[#451a1a] dark:to-[#1E2630] border-b border-red-100 dark:border-red-900/50 flex items-center gap-2">
                            <div className="p-1.5 bg-red-100 dark:bg-red-900/50 rounded-lg text-red-600 dark:text-red-400">
                                <AlertTriangle size={18} />
                            </div>
                            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm uppercase tracking-wide">
                                Stoppers / Riesgos
                            </h3>
                        </div>
                        <div className="flex-1 p-0">
                            <textarea
                                value={report.stoppers_risks}
                                onChange={(e) => setReport({ ...report, stoppers_risks: e.target.value })}
                                readOnly={!canEdit}
                                placeholder={canEdit ? "• Riesgo de retraso debido a...\n• Bloqueo en..." : "Sin información disponible"}
                                className="w-full h-full p-4 bg-transparent text-gray-700 dark:text-gray-300 resize-none border-none focus:ring-0 placeholder-gray-400 dark:placeholder-gray-600 text-sm leading-relaxed"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
