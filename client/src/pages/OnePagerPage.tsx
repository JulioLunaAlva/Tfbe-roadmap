
import React, { useState, useEffect, useMemo } from 'react';
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
}

export const OnePagerPage = () => {
    const { user, token } = useAuth();
    const { year, setYear } = useYear();

    // Selectors
    const [initiatives, setInitiatives] = useState<Initiative[]>([]);
    const [selectedInitiativeId, setSelectedInitiativeId] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(0); // 0-based index in the month's weeks array

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
                if (sorted.length > 0 && !selectedInitiativeId) {
                    setSelectedInitiativeId(sorted[0].id);
                }
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
            if (!selectedInitiativeId || !currentIsoWeek) return;
            setLoading(true);
            try {
                const res = await fetch(`${API_URL}/api/one-pagers?initiative_id=${selectedInitiativeId}&year=${year}&week_number=${currentIsoWeek}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (data) {
                    setReport({
                        main_progress: data.main_progress || '',
                        next_steps: data.next_steps || '',
                        stoppers_risks: data.stoppers_risks || ''
                    });
                } else {
                    setReport({ main_progress: '', next_steps: '', stoppers_risks: '' });
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, [selectedInitiativeId, currentIsoWeek, year, token]);

    const handleSave = async () => {
        if (!selectedInitiativeId) return;
        setSaving(true);
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
                throw new Error('Failed to save');
            }
        } catch (e) {
            setMessage({ type: 'error', text: 'Error al guardar el reporte' });
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

    const canEdit = user?.role === 'admin' || user?.role === 'editor';

    return (
        <div className="flex flex-col h-full space-y-4 p-2">
            {/* Header / Selectors */}
            <div className="bg-white dark:bg-[#1E2630] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
                <div className="flex flex-col md:flex-row gap-4 w-full">
                    {/* Initiative Selector */}
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Iniciativa</label>
                        <select
                            value={selectedInitiativeId}
                            onChange={(e) => setSelectedInitiativeId(e.target.value)}
                            className="w-full p-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#111827] text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        >
                            {initiatives.map(i => (
                                <option key={i.id} value={i.id}>{i.name}</option>
                            ))}
                        </select>
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

                {/* Save Button (Only if edit permission) */}
                {canEdit && (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center space-x-2 px-6 py-2.5 bg-[#005490] hover:bg-[#004270] text-white rounded-lg shadow-md transition-all disabled:opacity-50 h-fit"
                    >
                        <Save size={18} />
                        <span>{saving ? 'Guardando...' : 'Guardar'}</span>
                    </button>
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
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
                    {/* Left Column: Progress */}
                    <div className="bg-[#005490] rounded-xl overflow-hidden shadow-lg flex flex-col">
                        <div className="p-3 bg-[#004270] text-center border-b border-white/10">
                            <h3 className="text-white font-bold text-lg flex items-center justify-center gap-2">
                                <CheckCircle2 size={20} className="text-green-400" />
                                Detalle principales avances
                            </h3>
                        </div>
                        <div className="flex-1 p-1 bg-[#005490]">
                            <textarea
                                value={report.main_progress}
                                onChange={(e) => setReport({ ...report, main_progress: e.target.value })}
                                readOnly={!canEdit}
                                placeholder={canEdit ? "Describe los avances de la semana..." : "Sin información disponible"}
                                className="w-full h-full bg-[#005490] text-white p-4 resize-none border-none focus:ring-0 placeholder-white/30 text-base leading-relaxed"
                            />
                        </div>
                    </div>

                    {/* Right Column: Next Steps */}
                    <div className="bg-[#005490] rounded-xl overflow-hidden shadow-lg flex flex-col">
                        <div className="p-3 bg-[#004270] text-center border-b border-white/10">
                            <h3 className="text-white font-bold text-lg flex items-center justify-center gap-2">
                                <ArrowRight size={20} className="text-blue-300" />
                                Detalle siguientes pasos / Compromisos
                            </h3>
                        </div>
                        <div className="flex-1 p-1 bg-[#005490]">
                            <textarea
                                value={report.next_steps}
                                onChange={(e) => setReport({ ...report, next_steps: e.target.value })}
                                readOnly={!canEdit}
                                placeholder={canEdit ? "Describe los siguientes pasos..." : "Sin información disponible"}
                                className="w-full h-full bg-[#005490] text-white p-4 resize-none border-none focus:ring-0 placeholder-white/30 text-base leading-relaxed"
                            />
                        </div>
                    </div>

                    {/* Bottom: Stoppers/Risks (Full Width) */}
                    <div className="md:col-span-2 bg-[#005490] rounded-xl overflow-hidden shadow-lg flex flex-col min-h-[200px]">
                        <div className="p-3 bg-[#004270] text-center border-b border-white/10">
                            <h3 className="text-white font-bold text-lg flex items-center justify-center gap-2">
                                <AlertTriangle size={20} className="text-amber-400" />
                                Detalle Stoppers / Riesgo
                            </h3>
                        </div>
                        <div className="flex-1 p-1 bg-[#005490]">
                            <textarea
                                value={report.stoppers_risks}
                                onChange={(e) => setReport({ ...report, stoppers_risks: e.target.value })}
                                readOnly={!canEdit}
                                placeholder={canEdit ? "Describe los riesgos o bloqueos..." : "Sin información disponible"}
                                className="w-full h-full bg-[#005490] text-white p-4 resize-none border-none focus:ring-0 placeholder-white/30 text-base leading-relaxed"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
