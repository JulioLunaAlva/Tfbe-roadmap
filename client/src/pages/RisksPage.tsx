import { useState, useEffect, useMemo } from 'react';
import { ShieldAlert, Plus, Trash2, Edit3, X, AlertTriangle, AlertCircle, Info, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useYear } from '../context/YearContext';
import API_URL from '../config/api';

interface Risk {
    id: string;
    initiative_id: string;
    initiative_name: string;
    initiative_area: string;
    title: string;
    description: string;
    severity: string;
    status: string;
    mitigation: string;
    created_by_email: string;
    created_at: string;
}

interface Initiative {
    id: string;
    name: string;
    area: string;
}

const SEVERITIES = ['Crítico', 'Alto', 'Medio', 'Bajo'];
const STATUSES = ['Abierto', 'En Mitigación', 'Resuelto', 'Aceptado'];

const getSeverityStyle = (severity: string) => {
    switch (severity) {
        case 'Crítico': return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-800', icon: <AlertTriangle size={14} className="text-red-500" /> };
        case 'Alto': return { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800', icon: <AlertCircle size={14} className="text-orange-500" /> };
        case 'Medio': return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800', icon: <Info size={14} className="text-amber-500" /> };
        default: return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800', icon: <Info size={14} className="text-blue-500" /> };
    }
};

const getStatusStyle = (status: string) => {
    switch (status) {
        case 'Abierto': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
        case 'En Mitigación': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
        case 'Resuelto': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
        case 'Aceptado': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
        default: return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
    }
};

const formatDate = (d: string) => new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

export const RisksPage = () => {
    const { token, user } = useAuth();
    const { year } = useYear();
    const [risks, setRisks] = useState<Risk[]>([]);
    const [initiatives, setInitiatives] = useState<Initiative[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
    const [filterSeverity, setFilterSeverity] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    const [form, setForm] = useState({
        initiative_id: '',
        title: '',
        description: '',
        severity: 'Medio',
        status: 'Abierto',
        mitigation: '',
    });

    const canEdit = user?.role === 'admin' || user?.role === 'editor';

    useEffect(() => {
        if (!token) return;
        Promise.all([
            fetch(`${API_URL}/api/risks?year=${year}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
            fetch(`${API_URL}/api/initiatives?year=${year}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        ]).then(([risksData, initsData]) => {
            setRisks(Array.isArray(risksData) ? risksData : []);
            setInitiatives(Array.isArray(initsData) ? initsData : []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [token, year]);

    const filtered = useMemo(() => {
        let data = risks;
        if (filterSeverity) data = data.filter(r => r.severity === filterSeverity);
        if (filterStatus) data = data.filter(r => r.status === filterStatus);
        return data;
    }, [risks, filterSeverity, filterStatus]);

    const stats = useMemo(() => ({
        total: risks.length,
        critico: risks.filter(r => r.severity === 'Crítico' && r.status !== 'Resuelto').length,
        abierto: risks.filter(r => r.status === 'Abierto').length,
        resuelto: risks.filter(r => r.status === 'Resuelto').length,
    }), [risks]);

    const openCreate = () => {
        setEditingRisk(null);
        setForm({ initiative_id: '', title: '', description: '', severity: 'Medio', status: 'Abierto', mitigation: '' });
        setShowForm(true);
    };

    const openEdit = (risk: Risk) => {
        setEditingRisk(risk);
        setForm({
            initiative_id: risk.initiative_id,
            title: risk.title,
            description: risk.description,
            severity: risk.severity,
            status: risk.status,
            mitigation: risk.mitigation,
        });
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!form.initiative_id || !form.title.trim()) return;
        try {
            const url = editingRisk ? `${API_URL}/api/risks/${editingRisk.id}` : `${API_URL}/api/risks`;
            const method = editingRisk ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                // Refresh
                const risksRes = await fetch(`${API_URL}/api/risks?year=${year}`, { headers: { Authorization: `Bearer ${token}` } });
                setRisks(await risksRes.json());
                setShowForm(false);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este riesgo?')) return;
        try {
            await fetch(`${API_URL}/api/risks/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            setRisks(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent" /></div>;
    }

    return (
        <div className="w-full px-4 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl shadow-lg">
                        <ShieldAlert size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Riesgos & Blockers</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {stats.total} registros · {stats.abierto} abiertos · {year}
                        </p>
                    </div>
                </div>

                {canEdit && (
                    <button onClick={openCreate} className="flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-lg text-xs font-bold hover:from-rose-600 hover:to-red-700 transition-all shadow-md">
                        <Plus size={14} />
                        <span>Nuevo Riesgo</span>
                    </button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-[#1E2630] rounded-xl border border-gray-200 dark:border-gray-700/50 p-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-400 to-gray-500" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Total</p>
                    <p className="text-2xl font-extrabold text-gray-800 dark:text-white">{stats.total}</p>
                </div>
                <div className="bg-white dark:bg-[#1E2630] rounded-xl border border-gray-200 dark:border-gray-700/50 p-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-rose-600" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Críticos Abiertos</p>
                    <p className="text-2xl font-extrabold text-red-500">{stats.critico}</p>
                </div>
                <div className="bg-white dark:bg-[#1E2630] rounded-xl border border-gray-200 dark:border-gray-700/50 p-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Abiertos</p>
                    <p className="text-2xl font-extrabold text-amber-500">{stats.abierto}</p>
                </div>
                <div className="bg-white dark:bg-[#1E2630] rounded-xl border border-gray-200 dark:border-gray-700/50 p-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-green-500" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Resueltos</p>
                    <p className="text-2xl font-extrabold text-emerald-500">{stats.resuelto}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-3">
                <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} className="text-xs bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md px-2 py-1.5 text-[var(--text-primary)] outline-none">
                    <option value="">Todas las severidades</option>
                    {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-xs bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md px-2 py-1.5 text-[var(--text-primary)] outline-none">
                    <option value="">Todos los estatus</option>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {(filterSeverity || filterStatus) && (
                    <button onClick={() => { setFilterSeverity(''); setFilterStatus(''); }} className="text-xs text-gray-400 hover:text-red-400">Limpiar</button>
                )}
            </div>

            {/* Risk Cards */}
            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400 dark:text-gray-500">
                        <ShieldAlert size={32} className="mb-2 opacity-50" />
                        <p className="text-sm">Sin riesgos registrados</p>
                    </div>
                ) : filtered.map(risk => {
                    const sevStyle = getSeverityStyle(risk.severity);
                    return (
                        <div key={risk.id} className={`group bg-white dark:bg-[#1E2630] rounded-xl border ${sevStyle.border} p-4 hover:shadow-md transition-shadow`}>
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3 flex-1 min-w-0">
                                    <div className="mt-0.5 flex-shrink-0">{sevStyle.icon}</div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                            <h3 className="text-sm font-bold text-gray-800 dark:text-white">{risk.title}</h3>
                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${sevStyle.bg} ${sevStyle.text}`}>{risk.severity}</span>
                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${getStatusStyle(risk.status)}`}>{risk.status}</span>
                                        </div>
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                            {risk.initiative_name} · {risk.initiative_area}
                                        </p>
                                        {risk.description && (
                                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">{risk.description}</p>
                                        )}
                                        {risk.mitigation && (
                                            <div className="mt-2 px-2 py-1.5 bg-emerald-50 dark:bg-emerald-900/10 rounded-md border border-emerald-100 dark:border-emerald-800/30">
                                                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-0.5">Plan de Mitigación</p>
                                                <p className="text-xs text-emerald-700 dark:text-emerald-300">{risk.mitigation}</p>
                                            </div>
                                        )}
                                        <div className="flex items-center space-x-3 mt-2 text-[10px] text-gray-400">
                                            <span className="flex items-center"><Clock size={10} className="mr-1" />{formatDate(risk.created_at)}</span>
                                            {risk.created_by_email && <span>por {risk.created_by_email.split('@')[0]}</span>}
                                        </div>
                                    </div>
                                </div>
                                {canEdit && (
                                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                        <button onClick={() => openEdit(risk)} className="p-1.5 text-gray-400 hover:text-blue-500 rounded"><Edit3 size={14} /></button>
                                        <button onClick={() => handleDelete(risk.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded"><Trash2 size={14} /></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal Form */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
                    <div className="bg-white dark:bg-[#1E2630] rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">{editingRisk ? 'Editar Riesgo' : 'Nuevo Riesgo'}</h3>
                            <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Iniciativa *</label>
                                <select value={form.initiative_id} onChange={e => setForm(f => ({ ...f, initiative_id: e.target.value }))} className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-[#111827] text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500">
                                    <option value="">Seleccionar...</option>
                                    {initiatives.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Título *</label>
                                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-[#111827] text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Describir el riesgo..." />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Descripción</label>
                                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-[#111827] text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Severidad</label>
                                    <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))} className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-[#111827] text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500">
                                        {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Estatus</label>
                                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-[#111827] text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500">
                                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Plan de Mitigación</label>
                                <textarea value={form.mitigation} onChange={e => setForm(f => ({ ...f, mitigation: e.target.value }))} rows={2} className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-[#111827] text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="Acciones para mitigar el riesgo..." />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-2 pt-2">
                            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-xs text-gray-500 hover:text-gray-700 rounded-lg border border-gray-200 dark:border-gray-700">Cancelar</button>
                            <button onClick={handleSave} disabled={!form.initiative_id || !form.title.trim()} className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-red-600 rounded-lg hover:from-rose-600 hover:to-red-700 disabled:opacity-40 transition-all shadow-sm">
                                {editingRisk ? 'Actualizar' : 'Crear Riesgo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
