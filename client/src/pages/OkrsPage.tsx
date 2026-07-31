import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useYear } from '../context/YearContext';
import API_URL from '../config/api';
import { Target, Plus, Trash2, Edit2, Loader2 } from 'lucide-react';

interface OKR {
    id: string;
    title: string;
    description: string;
    year: number;
}

export const OkrsPage = () => {
    const { token, user } = useAuth();
    const { selectedYear } = useYear();
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

    return (
        <div className="h-full flex flex-col bg-[var(--bg-primary)] p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-sm">
                        <Target size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">OKRs Estratégicos ({selectedYear})</h1>
                        <p className="text-sm text-[var(--text-tertiary)]">Objetivos y Resultados Clave para alinear iniciativas</p>
                    </div>
                </div>
                
                {isEditor && (
                    <button 
                        onClick={() => { setIsCreating(true); setEditingId(null); setFormData({title: '', description: ''}); }}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors text-sm font-medium"
                    >
                        <Plus size={16} />
                        Nuevo OKR
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 className="animate-spin text-indigo-500" size={32} />
                    </div>
                ) : okrs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-60 text-gray-500">
                        <Target size={48} className="mb-4 opacity-20" />
                        <p>No hay OKRs definidos para {selectedYear}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {okrs.map(okr => (
                            <div key={okr.id} className="bg-white dark:bg-[#0D1520] p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800/50 hover:shadow-md transition-shadow group relative flex flex-col">
                                {isEditor && (
                                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white dark:bg-[#0D1520] p-1 rounded-lg shadow-sm">
                                        <button onClick={() => { setEditingId(okr.id); setFormData({ title: okr.title, description: okr.description }); setIsCreating(true); }} className="p-1.5 text-gray-400 hover:text-indigo-500 rounded"><Edit2 size={14}/></button>
                                        <button onClick={() => handleDelete(okr.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded ml-1"><Trash2 size={14}/></button>
                                    </div>
                                )}
                                <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2 pr-12">{okr.title}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 flex-1">{okr.description}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Create/Edit */}
            {isCreating && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#1A2332] rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                            <h2 className="font-bold text-lg text-gray-800 dark:text-white">{editingId ? 'Editar OKR' : 'Nuevo OKR'}</h2>
                        </div>
                        <form onSubmit={handleSave} className="p-4 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Título del OKR</label>
                                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0D1520] text-sm py-2" placeholder="Ej. Aumentar retención 20%" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
                                <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-[#0D1520] text-sm py-2" rows={4} placeholder="Detalles de los resultados clave..." />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">Cancelar</button>
                                <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
