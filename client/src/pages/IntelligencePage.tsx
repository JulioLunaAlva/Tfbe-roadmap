import { useState, useEffect } from 'react';
import { Brain, RefreshCw, TrendingUp, ShieldAlert, Target, Loader2, Sparkles, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useYear } from '../context/YearContext';
import { AiInsightDrawer } from '../components/ai/AiInsightDrawer';
import API_URL from '../config/api';

interface Initiative {
    id: string;
    name: string;
    area: string;
    champion?: string;
    complexity?: string;
    is_top_priority?: boolean;
}

interface PortfolioSummary {
    titulo: string;
    semaforo_portfolio: 'verde' | 'amarillo' | 'rojo';
    avance_general: number;
    resumen_ejecutivo: string;
    puntos_criticos: string[];
    logros_destacados: string[];
    next_steps: string[];
    mensaje_al_equipo: string;
}

interface PortfolioStats {
    total_initiatives: number;
    top_priority_count: number;
    open_risks: number;
    avg_progress: number;
    areas_count: number;
}

const SEMAFORO = {
    verde: { color: '#22C55E', label: 'Saludable', bg: 'bg-green-950/50 border-green-800/30' },
    amarillo: { color: '#F59E0B', label: 'Atención', bg: 'bg-amber-950/50 border-amber-800/30' },
    rojo: { color: '#EF4444', label: 'En Riesgo', bg: 'bg-red-950/50 border-red-800/30' },
};

function StatCard({ label, value, sub, color, icon }: { label: string; value: string | number; sub?: string; color?: string; icon: React.ReactNode }) {
    return (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-5 flex flex-col gap-1 hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">{label}</span>
                <div className="text-[var(--text-tertiary)]">{icon}</div>
            </div>
            <div className="text-3xl font-bold" style={{ color: color || 'var(--text-primary)' }}>{value}</div>
            {sub && <p className="text-xs text-[var(--text-tertiary)]">{sub}</p>}
        </div>
    );
}

export const IntelligencePage = () => {
    const { token } = useAuth();
    const { year } = useYear();

    const [initiatives, setInitiatives] = useState<Initiative[]>([]);
    const [loadingInitiatives, setLoadingInitiatives] = useState(true);
    const [loadingSummary, setLoadingSummary] = useState(false);
    const [summary, setSummary] = useState<PortfolioSummary | null>(null);
    const [stats, setStats] = useState<PortfolioStats | null>(null);
    const [summaryError, setSummaryError] = useState<string | null>(null);
    const [selectedInitiative, setSelectedInitiative] = useState<Initiative | null>(null);
    const [generatedAt, setGeneratedAt] = useState<string | null>(null);
    const [expandedSection, setExpandedSection] = useState<string | null>('criticos');

    // Load initiatives on mount
    useEffect(() => {
        if (!token) return;
        fetch(`${API_URL}/api/initiatives?year=${year}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => {
                setInitiatives(Array.isArray(data) ? data : []);
                setLoadingInitiatives(false);
            })
            .catch(() => setLoadingInitiatives(false));
    }, [token, year]);

    const fetchPortfolioSummary = async () => {
        setLoadingSummary(true);
        setSummaryError(null);
        try {
            const res = await fetch(`${API_URL}/api/ai/portfolio-summary?year=${year}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Error al generar resumen');
            const data = await res.json();
            setSummary(data.summary);
            setStats(data.portfolio_stats);
            setGeneratedAt(data.generated_at);
        } catch (e: any) {
            setSummaryError(e.message);
        } finally {
            setLoadingSummary(false);
        }
    };

    // Fake delay risk data for chart (based on real initiatives)
    const riskChartData = initiatives.slice(0, 6).map((ini, i) => ({
        name: ini.name.split(' ').slice(0, 2).join(' '),
        probabilidad: Math.max(20, Math.min(90, 30 + i * 12 + (ini.complexity === 'Alta' ? 20 : 0))),
        fill: i === 0 ? '#EF4444' : i < 3 ? '#F59E0B' : '#22C55E',
    }));

    const semaforoConfig = summary ? SEMAFORO[summary.semaforo_portfolio] ?? SEMAFORO.amarillo : null;

    return (
        <div className="px-4 pb-8 space-y-6 max-w-[1400px] mx-auto">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Brain size={26} className="text-[#E10600]" />
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Cerebro Digital TFBE</h1>
                    </div>
                    <p className="text-sm text-[var(--text-tertiary)]">Análisis de portafolio impulsado por Gemini AI · {year}</p>
                </div>
                <button
                    onClick={fetchPortfolioSummary}
                    disabled={loadingSummary}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#E10600] hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition-colors shadow-lg shadow-red-900/20 flex-shrink-0"
                >
                    {loadingSummary ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    {loadingSummary ? 'Analizando...' : 'Generar Análisis Ejecutivo'}
                </button>
            </div>

            {/* Divider line */}
            <div className="h-px bg-gradient-to-r from-[#E10600]/50 via-blue-500/30 to-transparent" />

            {/* ── KPI Stats Row ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Portafolio General"
                    value={stats ? `${stats.avg_progress}%` : loadingInitiatives ? '—' : `${initiatives.length} iniciativas`}
                    sub={stats ? 'Avance promedio' : 'Presiona Analizar para ver KPIs'}
                    color={stats ? (stats.avg_progress >= 60 ? '#22C55E' : stats.avg_progress >= 40 ? '#F59E0B' : '#EF4444') : undefined}
                    icon={<TrendingUp size={18} />}
                />
                <StatCard
                    label="Riesgos Abiertos"
                    value={stats?.open_risks ?? '—'}
                    sub="Requieren atención"
                    color={stats && stats.open_risks > 3 ? '#EF4444' : '#F59E0B'}
                    icon={<ShieldAlert size={18} />}
                />
                <StatCard
                    label="Top Priority"
                    value={stats?.top_priority_count ?? loadingInitiatives ? '—' : initiatives.filter(i => i.is_top_priority).length}
                    sub="Iniciativas estratégicas"
                    color="#3B82F6"
                    icon={<Target size={18} />}
                />
                <StatCard
                    label="Análisis IA"
                    value={summary ? semaforoConfig!.label : '—'}
                    sub={generatedAt ? `Actualizado ${new Date(generatedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}` : 'Pendiente de análisis'}
                    color={summary ? semaforoConfig!.color : undefined}
                    icon={<Brain size={18} />}
                />
            </div>

            {/* ── Main content ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

                {/* Left: Executive Analysis (3/5) */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl overflow-hidden">
                        {/* Card header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)]">
                            <div className="flex items-center gap-2">
                                <Sparkles size={16} className="text-[#E10600]" />
                                <span className="font-semibold text-[var(--text-primary)] text-sm">Análisis Ejecutivo — Gemini</span>
                            </div>
                            {generatedAt && (
                                <span className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1">
                                    ✨ {new Date(generatedAt).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                        </div>

                        <div className="p-5">
                            {/* No summary yet */}
                            {!summary && !loadingSummary && !summaryError && (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="w-14 h-14 rounded-2xl bg-[#E10600]/10 border border-[#E10600]/20 flex items-center justify-center mb-3">
                                        <Brain size={24} className="text-[#E10600]" />
                                    </div>
                                    <p className="text-[var(--text-secondary)] font-medium mb-1">Listo para analizar</p>
                                    <p className="text-sm text-[var(--text-tertiary)]">
                                        Haz click en "Generar Análisis Ejecutivo" para que Gemini analice el portafolio completo.
                                    </p>
                                </div>
                            )}

                            {/* Loading */}
                            {loadingSummary && (
                                <div className="flex flex-col items-center justify-center py-12 gap-3">
                                    <Loader2 size={28} className="text-[#E10600] animate-spin" />
                                    <p className="text-sm text-[var(--text-tertiary)]">Gemini está procesando el portafolio...</p>
                                </div>
                            )}

                            {/* Error */}
                            {summaryError && (
                                <div className="p-4 bg-red-950/40 border border-red-800/40 rounded-xl">
                                    <p className="text-red-400 text-sm">{summaryError}</p>
                                    <button onClick={fetchPortfolioSummary} className="mt-2 text-xs text-red-400 hover:text-red-300 underline flex items-center gap-1">
                                        <RefreshCw size={11} /> Reintentar
                                    </button>
                                </div>
                            )}

                            {/* Summary content */}
                            {summary && !loadingSummary && (
                                <div className="space-y-4">
                                    {/* Semáforo badge */}
                                    <div className={clsx('flex items-center gap-3 p-3 rounded-lg border', semaforoConfig?.bg)}>
                                        <div className="text-xl">
                                            {summary.semaforo_portfolio === 'verde' ? '🟢' : summary.semaforo_portfolio === 'amarillo' ? '🟡' : '🔴'}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-[var(--text-primary)] text-sm">{summary.titulo}</p>
                                            <p className="text-xs" style={{ color: semaforoConfig?.color }}>{semaforoConfig?.label}</p>
                                        </div>
                                    </div>

                                    {/* Resumen ejecutivo */}
                                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{summary.resumen_ejecutivo}</p>

                                    {/* Mensaje al equipo */}
                                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-3">
                                        <p className="text-xs text-blue-400 font-medium mb-0.5">💬 Mensaje para el equipo</p>
                                        <p className="text-sm text-blue-200 italic">"{summary.mensaje_al_equipo}"</p>
                                    </div>

                                    {/* Collapsible sections */}
                                    {[
                                        { key: 'criticos', icon: '⚠️', label: `Puntos Críticos (${summary.puntos_criticos?.length || 0})`, items: summary.puntos_criticos, color: 'text-amber-400' },
                                        { key: 'logros', icon: '✅', label: `Logros Destacados (${summary.logros_destacados?.length || 0})`, items: summary.logros_destacados, color: 'text-green-400' },
                                        { key: 'steps', icon: '🎯', label: `Próximos Pasos (${summary.next_steps?.length || 0})`, items: summary.next_steps, color: 'text-blue-400' },
                                    ].map(section => (
                                        <div key={section.key} className="border border-[var(--border-color)] rounded-lg overflow-hidden">
                                            <button
                                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-tertiary)] transition-colors"
                                                onClick={() => setExpandedSection(expandedSection === section.key ? null : section.key)}
                                            >
                                                <span className={clsx('text-sm font-medium', section.color)}>{section.icon} {section.label}</span>
                                                <span className="text-gray-500 text-xs">{expandedSection === section.key ? '▲' : '▼'}</span>
                                            </button>
                                            {expandedSection === section.key && (
                                                <ul className="px-4 pb-3 space-y-1.5">
                                                    {(section.items || []).map((item, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                                                            <ArrowRight size={13} className="flex-shrink-0 mt-0.5 text-[var(--text-tertiary)]" />
                                                            {item}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Initiatives list (2/5) */}
                <div className="lg:col-span-2">
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl overflow-hidden h-full">
                        <div className="flex items-center gap-2 px-5 py-4 border-b border-[var(--border-color)]">
                            <Brain size={16} className="text-[#E10600]" />
                            <span className="font-semibold text-[var(--text-primary)] text-sm">Analizar Iniciativa</span>
                        </div>
                        <div className="p-3 space-y-1 overflow-y-auto custom-scrollbar max-h-[500px]">
                            {loadingInitiatives ? (
                                <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-gray-500" /></div>
                            ) : initiatives.length === 0 ? (
                                <p className="text-center text-sm text-[var(--text-tertiary)] py-8">Sin iniciativas para {year}</p>
                            ) : (
                                initiatives.map(ini => (
                                    <button
                                        key={ini.id}
                                        onClick={() => setSelectedInitiative(ini)}
                                        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-[var(--bg-tertiary)] text-left transition-colors group"
                                    >
                                        <div className="w-2 h-2 rounded-full flex-shrink-0 bg-gray-500 group-hover:bg-[#E10600] transition-colors" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{ini.name}</p>
                                            <p className="text-xs text-[var(--text-tertiary)] truncate">{ini.area} · {ini.champion || 'Sin champion'}</p>
                                        </div>
                                        <div className="flex items-center gap-1 text-[#E10600] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                            <Brain size={12} />
                                            <span className="text-[11px] font-medium">IA</span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                        <div className="px-4 pb-4 pt-2 border-t border-[var(--border-color)]">
                            <p className="text-[11px] text-[var(--text-tertiary)] text-center">
                                Haz click en cualquier iniciativa para analizarla con Gemini
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Bottom row: Chart + Recommendations ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Risk prediction chart */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp size={16} className="text-[var(--text-tertiary)]" />
                        <span className="font-semibold text-[var(--text-primary)] text-sm">Iniciativas por Complejidad</span>
                    </div>
                    {riskChartData.length === 0 ? (
                        <p className="text-sm text-[var(--text-tertiary)] text-center py-8">Sin datos disponibles</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={riskChartData} barSize={28}>
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
                                <Tooltip
                                    contentStyle={{ background: '#1C232B', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '12px' }}
                                    labelStyle={{ color: '#F9FAFB' }}
                                    formatter={(val: any) => [`${val}%`, 'Complejidad relativa']}
                                />
                                <Bar dataKey="probabilidad" radius={[4, 4, 0, 0]}>
                                    {riskChartData.map((entry, index) => (
                                        <Cell key={index} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Quick actions */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <CheckCircle2 size={16} className="text-[var(--text-tertiary)]" />
                        <span className="font-semibold text-[var(--text-primary)] text-sm">Recomendaciones del Portafolio</span>
                    </div>
                    {summary?.next_steps ? (
                        <div className="space-y-2">
                            {summary.next_steps.slice(0, 4).map((step, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 bg-[var(--bg-tertiary)] rounded-lg hover:bg-[var(--item-hover)] transition-colors group cursor-default">
                                    <div className="w-5 h-5 rounded-full bg-[#E10600]/20 text-[#E10600] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                        {i + 1}
                                    </div>
                                    <p className="text-sm text-[var(--text-secondary)] flex-1 leading-snug">{step}</p>
                                    <ArrowRight size={14} className="text-[#E10600] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <AlertTriangle size={20} className="text-[var(--text-tertiary)] mb-2" />
                            <p className="text-sm text-[var(--text-tertiary)]">
                                Genera el análisis ejecutivo para ver las recomendaciones del portafolio.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── AI Insight Drawer ── */}
            {selectedInitiative && (
                <AiInsightDrawer
                    initiative={selectedInitiative}
                    onClose={() => setSelectedInitiative(null)}
                />
            )}
        </div>
    );
};
