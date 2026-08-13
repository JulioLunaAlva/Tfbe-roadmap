import { useState } from 'react';
import { X, RefreshCw, CheckCircle, Brain, AlertTriangle, Lightbulb, TrendingUp, Loader2, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config/api';

interface Initiative {
    id: string;
    name: string;
    area: string;
    champion?: string;
    complexity?: string;
    is_top_priority?: boolean;
}

interface AiInsight {
    estado: string;
    semaforo: 'verde' | 'amarillo' | 'rojo';
    confianza: number;
    resumen: string;
    alertas: { nivel: string; titulo: string; detalle: string }[];
    recomendaciones: { prioridad: number; accion: string; responsable: string; plazo: string }[];
    prediccion: string;
    patron_detectado: string;
}

interface Props {
    initiative: Initiative;
    onClose: () => void;
}

const SEMAFORO_CONFIG = {
    verde: { label: 'Saludable', color: '#22C55E', bg: 'bg-green-950/60', border: 'border-green-800/40', text: 'text-green-400' },
    amarillo: { label: 'Atención', color: '#F59E0B', bg: 'bg-amber-950/60', border: 'border-amber-800/40', text: 'text-amber-400' },
    rojo: { label: 'En Riesgo', color: '#EF4444', bg: 'bg-red-950/60', border: 'border-red-800/40', text: 'text-red-400' },
};

const NIVEL_CONFIG: Record<string, { icon: string; color: string; border: string }> = {
    critica: { icon: '⛔', color: 'text-red-400', border: 'border-l-red-500' },
    alta: { icon: '⚠️', color: 'text-amber-400', border: 'border-l-amber-500' },
    media: { icon: '💡', color: 'text-blue-400', border: 'border-l-blue-500' },
};

const PLAZO_CONFIG: Record<string, string> = {
    'Inmediato': 'bg-red-500/20 text-red-300',
    'Esta semana': 'bg-amber-500/20 text-amber-300',
    'Próximas 2 semanas': 'bg-blue-500/20 text-blue-300',
};

type Tab = 'resumen' | 'alertas' | 'recomendaciones' | 'prediccion';

export function AiInsightDrawer({ initiative, onClose }: Props) {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [insight, setInsight] = useState<AiInsight | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('resumen');
    const [generatedAt, setGeneratedAt] = useState<string | null>(null);
    const [resolvedIds, setResolvedIds] = useState<Set<number>>(new Set());
    const [expandedAlert, setExpandedAlert] = useState<number | null>(null);

    const fetchInsights = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/api/ai/insights/${initiative.id}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Error al analizar');
            }
            const data = await res.json();
            setInsight(data.insights);
            setGeneratedAt(data.generated_at);
            setActiveTab('resumen');
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const semaforoConfig = insight ? SEMAFORO_CONFIG[insight.semaforo] ?? SEMAFORO_CONFIG.amarillo : null;

    const tabs: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
        { key: 'resumen', label: 'Resumen', icon: <Brain size={14} /> },
        { key: 'alertas', label: 'Alertas', icon: <AlertTriangle size={14} />, count: insight?.alertas?.length },
        { key: 'recomendaciones', label: 'Acciones', icon: <Lightbulb size={14} />, count: insight?.recomendaciones?.length },
        { key: 'prediccion', label: 'Predicción', icon: <TrendingUp size={14} /> },
    ];

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Drawer */}
            <div className="relative w-full max-w-[520px] h-full bg-[#13181F] border-l border-white/5 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">

                {/* ── Header ── */}
                <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-white/5">
                    {/* Badge */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full">
                            <Brain size={12} className="text-[#E10600]" />
                            <span className="text-xs text-gray-400 font-medium">Análisis IA — Gemini 1.5 Flash</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Initiative info */}
                    <h2 className="text-xl font-bold text-white leading-tight mb-2">{initiative.name}</h2>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {insight && (
                            <span className={clsx('px-2 py-0.5 rounded-full text-xs font-semibold', semaforoConfig?.text, semaforoConfig?.bg)}>
                                {semaforoConfig?.label}
                            </span>
                        )}
                        {initiative.complexity && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-white/5 text-gray-400">{initiative.complexity} Complejidad</span>
                        )}
                        {initiative.is_top_priority && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-300">⭐ Top Prioridad</span>
                        )}
                    </div>
                    {initiative.champion && (
                        <p className="text-xs text-gray-500">Champion: <span className="text-gray-300">{initiative.champion}</span></p>
                    )}
                </div>

                {/* ── Content ── */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* Initial state */}
                    {!insight && !loading && !error && (
                        <div className="flex flex-col items-center justify-center h-full px-8 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-[#E10600]/10 border border-[#E10600]/20 flex items-center justify-center mb-4">
                                <Brain size={28} className="text-[#E10600]" />
                            </div>
                            <p className="text-white font-semibold mb-1">Cerebro Digital listo</p>
                            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                                Gemini analizará el progreso, riesgos, tareas y dependencias de esta iniciativa para generar un diagnóstico ejecutivo.
                            </p>
                            <button
                                onClick={fetchInsights}
                                className="px-5 py-2.5 bg-[#E10600] hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2 shadow-lg shadow-red-900/30"
                            >
                                <Brain size={16} />
                                Generar Análisis
                            </button>
                        </div>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <Loader2 size={32} className="text-[#E10600] animate-spin" />
                            <div className="text-center">
                                <p className="text-white font-medium">Analizando iniciativa...</p>
                                <p className="text-sm text-gray-500 mt-1">Gemini está procesando los datos</p>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="m-5 p-4 bg-red-950/40 border border-red-800/40 rounded-xl">
                            <p className="text-red-400 font-medium text-sm mb-1">Error al analizar</p>
                            <p className="text-red-300/70 text-xs">{error}</p>
                            <button onClick={fetchInsights} className="mt-3 text-xs text-red-400 hover:text-red-300 underline">
                                Intentar de nuevo
                            </button>
                        </div>
                    )}

                    {/* Insight content */}
                    {insight && !loading && (
                        <div className="p-5 space-y-4">
                            {/* Semáforo card */}
                            <div className={clsx('p-4 rounded-xl border flex items-center gap-4', semaforoConfig?.bg, semaforoConfig?.border)}>
                                <div className="relative flex-shrink-0">
                                    <div
                                        className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold border-2"
                                        style={{ borderColor: semaforoConfig?.color, boxShadow: `0 0 20px ${semaforoConfig?.color}55` }}
                                    >
                                        {insight.semaforo === 'verde' ? '🟢' : insight.semaforo === 'amarillo' ? '🟡' : '🔴'}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={clsx('font-bold text-base uppercase tracking-wide', semaforoConfig?.text)}>
                                        {semaforoConfig?.label}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-700"
                                                style={{ width: `${insight.confianza}%`, backgroundColor: semaforoConfig?.color }}
                                            />
                                        </div>
                                        <span className="text-xs text-gray-400 flex-shrink-0">{insight.confianza}% confianza</span>
                                    </div>
                                    {generatedAt && (
                                        <p className="text-[11px] text-gray-600 mt-1 flex items-center gap-1">
                                            <Clock size={10} />
                                            {new Date(generatedAt).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Patron detectado */}
                            {insight.patron_detectado && insight.patron_detectado !== 'Ninguno' && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                                    <span className="text-purple-400 text-sm">🔍</span>
                                    <span className="text-xs text-purple-300">Patrón: <strong>{insight.patron_detectado}</strong></span>
                                </div>
                            )}

                            {/* Tabs */}
                            <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={clsx(
                                            'flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-xs font-medium transition-all duration-200',
                                            activeTab === tab.key
                                                ? 'bg-[#E10600] text-white shadow-sm'
                                                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                                        )}
                                    >
                                        {tab.icon}
                                        <span className="hidden sm:inline">{tab.label}</span>
                                        {tab.count !== undefined && tab.count > 0 && (
                                            <span className={clsx(
                                                'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                                                activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-white/10 text-gray-400'
                                            )}>
                                                {tab.count}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Tab: Resumen */}
                            {activeTab === 'resumen' && (
                                <div className="bg-white/3 rounded-xl p-4 border border-white/5">
                                    <p className="text-gray-200 text-sm leading-relaxed">{insight.resumen}</p>
                                </div>
                            )}

                            {/* Tab: Alertas */}
                            {activeTab === 'alertas' && (
                                <div className="space-y-2">
                                    {(insight.alertas || []).length === 0 ? (
                                        <p className="text-gray-500 text-sm text-center py-6">✅ Sin alertas críticas detectadas</p>
                                    ) : (
                                        (insight.alertas || []).map((alerta, idx) => {
                                            const cfg = NIVEL_CONFIG[alerta.nivel] ?? NIVEL_CONFIG['media'];
                                            return (
                                                <div
                                                    key={idx}
                                                    className={clsx('bg-white/3 border border-white/5 border-l-2 rounded-xl overflow-hidden cursor-pointer', cfg.border)}
                                                    onClick={() => setExpandedAlert(expandedAlert === idx ? null : idx)}
                                                >
                                                    <div className="flex items-center gap-3 p-3">
                                                        <span className="text-base flex-shrink-0">{cfg.icon}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={clsx('text-sm font-medium', cfg.color)}>{alerta.titulo}</p>
                                                        </div>
                                                        {expandedAlert === idx ? <ChevronUp size={14} className="text-gray-500 flex-shrink-0" /> : <ChevronDown size={14} className="text-gray-500 flex-shrink-0" />}
                                                    </div>
                                                    {expandedAlert === idx && (
                                                        <div className="px-4 pb-3">
                                                            <p className="text-xs text-gray-400 leading-relaxed">{alerta.detalle}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}

                            {/* Tab: Recomendaciones */}
                            {activeTab === 'recomendaciones' && (
                                <div className="space-y-2">
                                    {(insight.recomendaciones || []).map((rec, idx) => (
                                        <div
                                            key={idx}
                                            className={clsx(
                                                'bg-white/3 border border-white/5 rounded-xl p-3 flex items-start gap-3 transition-opacity',
                                                resolvedIds.has(idx) ? 'opacity-40' : ''
                                            )}
                                        >
                                            <div className="w-6 h-6 rounded-full bg-[#E10600]/20 text-[#E10600] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                                {rec.prioridad}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-200 leading-snug mb-1.5">{rec.accion}</p>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-[11px] text-gray-500">👤 {rec.responsable}</span>
                                                    <span className={clsx('text-[11px] px-2 py-0.5 rounded-full', PLAZO_CONFIG[rec.plazo] || 'bg-white/10 text-gray-400')}>
                                                        {rec.plazo}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setResolvedIds(prev => { const s = new Set(prev); s.has(idx) ? s.delete(idx) : s.add(idx); return s; })}
                                                className={clsx('flex-shrink-0 p-1 rounded transition-colors', resolvedIds.has(idx) ? 'text-green-400' : 'text-gray-600 hover:text-gray-300')}
                                                title="Marcar como implementada"
                                            >
                                                <CheckCircle size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Tab: Predicción */}
                            {activeTab === 'prediccion' && (
                                <div className="bg-white/3 rounded-xl p-4 border border-white/5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <TrendingUp size={14} className="text-purple-400" />
                                        <span className="text-xs font-medium text-purple-400 uppercase tracking-wide">Si no se actúa en 14 días</span>
                                    </div>
                                    <p className="text-gray-200 text-sm leading-relaxed">{insight.prediccion}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                {insight && !loading && (
                    <div className="flex-shrink-0 p-4 border-t border-white/5 flex gap-3">
                        <button
                            onClick={fetchInsights}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm font-medium transition-colors border border-white/5"
                        >
                            <RefreshCw size={14} />
                            Regenerar
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#E10600] hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-red-900/20"
                        >
                            <CheckCircle size={14} />
                            Listo
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
