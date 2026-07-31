import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useYear } from '../context/YearContext';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config/api';
import { Target, Plus, Trash2, Edit2, Loader2, Info, Rocket, ExternalLink, Activity } from 'lucide-react';
import { clsx } from 'clsx';

interface LinkedInitiative {
    id: string;
    name: string;
    progress: number;
    status: string;
}

interface OKR {
    id: string;
    title: string;
    description: string;
    year: number;
    initiatives: LinkedInitiative[] | null;
}

export const OkrsPage = () => {
    const { token, user } = useAuth();
    const { year: selectedYear } = useYear();
    const navigate = useNavigate();
    const [okrs, setOkrs] = useState<OKR[]>([]);
    const [loading, setLoading] = useState(true);

    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ title: '', description: '' });

    const fetchOkrs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/okrs?year=${selectedYear}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setOkrs(data);
            }
        } catch (error) {
            console.error("Error fetching okrs:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (token) fetchOkrs();
    }, [token, selectedYear]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const method = editingId ? 'PUT' : 'POST';
            const url = editingId ? `${API_URL}/api/okrs/${editingId}` : `${API_URL}/api/okrs`;
            
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ ...formData, year: selectedYear })
            });

            if (res.ok) {
                setIsCreating(false);
                setEditingId(null);
                setFormData({ title: '', description: '' });
                fetchOkrs();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este OKR? Esto no eliminará las iniciativas, pero quitará el vínculo.')) return;
        try {
            const res = await fetch(`${API_URL}/api/okrs/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setOkrs(okrs.filter(o => o.id !== id));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const isEditor = user?.role === 'admin' || user?.role === 'editor';

    // Calculate OKR average progress
    const calculateProgress = (initiatives: LinkedInitiative[] | null) => {
        if (!initiatives || initiatives.length === 0) return 0;
        const total = initiatives.reduce((acc, curr) => acc + (curr.progress || 0), 0);
        return Math.round(total / initiatives.length);
    };

    return (
        <div className="h-full flex flex-col bg-[var(--bg-primary)] p-6 overflow-hidden">
            {/* Header & Onboarding */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-sm">
                        <Target size={28} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Tablero Estratégico de OKRs ({selectedYear})</h1>
                        <p className="text-sm text-[var(--text-tertiary)]">Alineación entre Objetivos de Alto Nivel y Ejecución de Proyectos</p>
                    </div>
                </div>
                
                {isEditor && (
                    <button 
                        onClick={() => { setIsCreating(true); setEditingId(null); setFormData({title: '', description: ''}); }}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors text-sm font-medium"
                    >
                        <Plus size={16} />
                        Nuevo Objetivo (OKR)
                    </button>
                )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6 flex items-start gap-3">
                <Info className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-blue-800 dark:text-blue-300">
                    <p className="font-semibold mb-1">¿Qué es esta pantalla?</p>
                    <p>Los <strong>OKRs</strong> representan las grandes metas o "Resultados Clave" de Transformación. Aquí puedes visualizar cómo las iniciativas del Roadmap (proyectos) están empujando la aguja de los objetivos estratégicos. El progreso de cada OKR se calcula automáticamente promediando el avance real de sus iniciativas vinculadas.</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 className="animate-spin text-indigo-500" size={32} />
                    </div>
                ) : okrs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-60 bg-white dark:bg-[#1A2332] rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm text-gray-500">
                        <Target size={48} className="mb-4 opacity-20" />
                        <p className="text-lg font-medium text-gray-800 dark:text-gray-200">No hay OKRs estratégicos definidos para {selectedYear}</p>
                        <p className="text-sm">Comienza agregando un nuevo Objetivo para alinear tu Roadmap.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-6">
                        {okrs.map(okr => {
                            const progress = calculateProgress(okr.initiatives);
                            return (
                                <div key={okr.id} className="bg-white dark:bg-[#1A2332] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col group relative">
                                    {/* OKR Header */}
                                    <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0D1520]/50">
                                        {isEditor && (
                                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white dark:bg-[#1A2332] p-1 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
                                                <button onClick={() => { setEditingId(okr.id); setFormData({ title: okr.title, description: okr.description }); setIsCreating(true); }} className="p-1.5 text-gray-400 hover:text-indigo-500 rounded"><Edit2 size={14}/></button>
                                                <button onClick={() => handleDelete(okr.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded ml-1"><Trash2 size={14}/></button>
                                            </div>
                                        )}
                                        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-2 pr-16">{okr.title}</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{okr.description}</p>
                                        
                                        {/* OKR Progress */}
                                        <div>
                                            <div className="flex justify-between items-end mb-1.5">
                                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Progreso Global del Objetivo</span>
                                                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{progress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                                <div 
                                                    className="h-2.5 rounded-full transition-all duration-500 bg-gradient-to-r from-indigo-500 to-purple-500"
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Linked Initiatives */}
                                    <div className="p-5 flex-1 flex flex-col bg-white dark:bg-[#1A2332]">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Rocket size={16} className="text-gray-400" />
                                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Iniciativas Vinculadas ({okr.initiatives?.length || 0})</h4>
                                        </div>
                                        
                                        {!okr.initiatives || okr.initiatives.length === 0 ? (
                                            <div className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-center">
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Aún no hay iniciativas aportando a este OKR.</p>
                                                <p className="text-xs text-gray-400">Puedes vincularlas editando una iniciativa desde el Roadmap.</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-2">
                                                {okr.initiatives.map(init => (
                                                    <div key={init.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors group/item">
                                                        <div className="flex-1 min-w-0 pr-4">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h5 className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate" title={init.name}>{init.name}</h5>
                                                                <button onClick={() => navigate('/')} className="opacity-0 group-hover/item:opacity-100 text-indigo-500 hover:text-indigo-600 transition-opacity" title="Ver en Roadmap">
                                                                    <ExternalLink size={12} />
                                                                </button>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className={clsx(
                                                                    "text-[10px] px-1.5 py-0.5 rounded font-medium",
                                                                    init.status?.toLowerCase().includes('retrasado') ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                                                    init.status?.toLowerCase().includes('entregado') ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                                                    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                                                )}>
                                                                    {init.status || 'En Plan'}
                                                                </span>
                                                                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                                    <Activity size={12} />
                                                                    {init.progress || 0}% avance
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="w-16">
                                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                                                <div 
                                                                    className={clsx(
                                                                        "h-1.5 rounded-full transition-all",
                                                                        init.status?.toLowerCase().includes('retrasado') ? "bg-red-500" : 
                                                                        init.status?.toLowerCase().includes('entregado') ? "bg-emerald-500" : "bg-indigo-500"
                                                                    )}
                                                                    style={{ width: `${init.progress || 0}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal Create/Edit */}
            {isCreating && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#1A2332] rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                            <h2 className="font-bold text-lg text-gray-800 dark:text-white">{editingId ? 'Editar OKR Estratégico' : 'Nuevo OKR Estratégico'}</h2>
                        </div>
                        <form onSubmit={handleSave} className="p-4 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Título del OKR</label>
                                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0D1520] text-sm py-2 focus:ring-2 focus:ring-indigo-500" placeholder="Ej. Aumentar retención 20%" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Descripción y Resultados Clave</label>
                                <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0D1520] text-sm py-2 focus:ring-2 focus:ring-indigo-500" rows={4} placeholder="Describe qué significa este objetivo y cómo mediremos el éxito..." />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">Cancelar</button>
                                <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">Guardar OKR</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
