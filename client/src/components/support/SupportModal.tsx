
import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

export interface SupportItem {
    id?: string;
    name: string;
    area: string;
    technology?: string;
    champion?: string;
    description?: string;
    responsible: 'BE' | 'D&A' | 'BE & D&A' | 'BE & TERCEROS';
    status: 'Active' | 'On Hold' | 'Completed';
}

interface SupportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: SupportItem) => Promise<void>;
    initialData?: SupportItem;
}

const RESPONSIBLES = ['BE', 'D&A', 'BE & D&A', 'BE & TERCEROS'];
const STATUSES = ['Active', 'On Hold', 'Completed'];

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState<SupportItem>({
        name: '',
        area: '',
        technology: '',
        champion: '',
        description: '',
        responsible: 'BE',
        status: 'Active'
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({
                name: '',
                area: '',
                technology: '',
                champion: '',
                description: '',
                responsible: 'BE',
                status: 'Active'
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#1E2630] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-[var(--bg-secondary)]">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                        {initialData ? 'Editar Soporte' : 'Nuevo Soporte'}
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre Iniciativa *</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#111827] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            placeholder="Ej. Mantenimiento..."
                        />
                    </div>

                    {/* Area & Technology */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Área *</label>
                            <input
                                type="text"
                                required
                                value={formData.area}
                                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#111827] text-gray-900 dark:text-white"
                                placeholder="Ej. Finanzas"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tecnología</label>
                            <input
                                type="text"
                                value={formData.technology || ''}
                                onChange={(e) => setFormData({ ...formData, technology: e.target.value })}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#111827] text-gray-900 dark:text-white"
                                placeholder="Ej. React, SQL"
                            />
                        </div>
                    </div>

                    {/* Champion & Responsible */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Champion</label>
                            <input
                                type="text"
                                value={formData.champion || ''}
                                onChange={(e) => setFormData({ ...formData, champion: e.target.value })}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#111827] text-gray-900 dark:text-white"
                                placeholder="Nombre..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Responsable *</label>
                            <select
                                required
                                value={formData.responsible}
                                onChange={(e) => setFormData({ ...formData, responsible: e.target.value as any })}
                                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#111827] text-gray-900 dark:text-white"
                            >
                                {RESPONSIBLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estatus</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                            className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#111827] text-gray-900 dark:text-white"
                        >
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                        <textarea
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#111827] text-gray-900 dark:text-white resize-none"
                            placeholder="Detalles adicionales..."
                        />
                    </div>
                </form>

                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-[var(--bg-secondary)]">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 font-medium">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save size={18} />
                        {loading ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    );
};
