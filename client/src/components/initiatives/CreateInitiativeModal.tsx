import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config/api';

interface Props {
    onClose: () => void;
    onSave: () => void;
}

interface InitiativeForm {
    name: string;
    area: string;
    champion: string;
    transformation_lead: string;
    complexity: string;
    is_top_priority: boolean;
    year: number;
    notes: string;
    technologies: string[];
    status: string;
    start_date: Date | null;
    end_date: Date | null;
    progress: number;
}

export const CreateInitiativeModal: React.FC<Props> = ({ onClose, onSave }) => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState<InitiativeForm>({
        name: '',
        area: '',
        champion: '',
        transformation_lead: '',
        complexity: 'Media',
        is_top_priority: false,
        year: new Date().getFullYear(),
        notes: '',
        technologies: [] as string[],
        status: 'En espera',
        start_date: null,
        end_date: null,
        progress: 0,
    });

    const [techInput, setTechInput] = useState('');

    // Predefined lists
    const areas: string[] = [];
    const complexities = ['Alta', 'Media', 'Baja'];
    const statuses = ['En espera', 'En curso', 'Entregado', 'Cancelado', 'Retrasado'];
    const suggestedTechs = [

        'Python',
        'Power App',
        'Power Query',
        'Power Automate',
        'Sharepoint',
        'Flujo Automatizado VB',
        'VB Scripting',
        'Agente',
        'SAP',
        'Excel'
    ];

    const handleAddTech = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && techInput.trim()) {
            e.preventDefault();
            if (!formData.technologies.includes(techInput.trim())) {
                setFormData(prev => ({ ...prev, technologies: [...prev.technologies, techInput.trim()] }));
            }
            setTechInput('');
        }
    };

    const removeTech = (tech: string) => {
        setFormData(prev => ({ ...prev, technologies: prev.technologies.filter(t => t !== tech) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/initiatives`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                onSave();
                onClose();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to create');
            }
        } catch (error) {
            alert('Error connecting to server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" >
            <div className="bg-white dark:bg-[#1E2630] rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-colors">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Nueva Iniciativa</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Name */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre de la Iniciativa</label>
                            <input
                                type="text"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 bg-white dark:bg-[#2A3441] text-gray-900 dark:text-white"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ej. Automatización de Cuentas por Pagar"
                            />
                        </div>

                        {/* Champion */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Champion / Responsable</label>
                            <input
                                type="text"
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 bg-white dark:bg-[#2A3441] text-gray-900 dark:text-white"
                                value={formData.champion}
                                onChange={e => setFormData({ ...formData, champion: e.target.value })}
                                placeholder="Nombre del Champion"
                            />
                        </div>

                        {/* Transformation Lead */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Responsable Transformación</label>
                            <input
                                type="text"
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 bg-white dark:bg-[#2A3441] text-gray-900 dark:text-white"
                                value={formData.transformation_lead}
                                onChange={e => setFormData({ ...formData, transformation_lead: e.target.value })}
                                placeholder="Nombre del Responsable Transf."
                            />
                        </div>

                        {/* Area */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Área</label>
                            <input
                                list="areas"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 bg-white dark:bg-[#2A3441] text-gray-900 dark:text-white"
                                value={formData.area}
                                onChange={e => setFormData({ ...formData, area: e.target.value })}
                                placeholder="Seleccione o escriba..."
                            />
                            <datalist id="areas">
                                {areas.map(a => <option key={a} value={a} />)}
                            </datalist>
                        </div>



                        {/* Complexity */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Complejidad</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 bg-white dark:bg-[#2A3441] text-gray-900 dark:text-white"
                                value={formData.complexity}
                                onChange={e => setFormData({ ...formData, complexity: e.target.value })}
                            >
                                {complexities.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estatus</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 bg-white dark:bg-[#2A3441] text-gray-900 dark:text-white"
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                            >
                                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        {/* Technologies (Tags) - Moved Up */}
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tecnologías</label>
                            <div className="mt-1 flex flex-wrap gap-2 border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-[#2A3441] min-h-[42px]">
                                {formData.technologies.map(tech => (
                                    <span key={tech} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
                                        {tech}
                                        <button type="button" onClick={() => removeTech(tech)} className="ml-1 text-indigo-500 hover:text-indigo-900 dark:text-indigo-300 dark:hover:text-white">
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                                <div className="relative flex-1 min-w-[80px]">
                                    <input
                                        type="text"
                                        list="tech-suggestions"
                                        className="w-full outline-none border-none focus:ring-0 p-1 text-xs bg-transparent text-gray-900 dark:text-white"
                                        placeholder="Add..."
                                        value={techInput}
                                        onChange={e => setTechInput(e.target.value)}
                                        onKeyDown={handleAddTech}
                                    />
                                    <datalist id="tech-suggestions">
                                        {suggestedTechs.map(t => <option key={t} value={t} />)}
                                    </datalist>
                                </div>
                            </div>
                        </div>

                        {/* Progress */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Progreso (%)</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 bg-white dark:bg-[#2A3441] text-gray-900 dark:text-white"
                                value={formData.progress}
                                onChange={e => setFormData({ ...formData, progress: Number(e.target.value) })}
                            />
                        </div>

                        {/* Year */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Año</label>
                            <input
                                type="number"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 bg-white dark:bg-[#2A3441] text-gray-900 dark:text-white"
                                value={formData.year}
                                onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })}
                            />
                        </div>

                        {/* Start Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha Inicio</label>
                            <input
                                type="date"
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 bg-white dark:bg-[#2A3441] text-gray-900 dark:text-white"
                                value={formData.start_date ? formData.start_date.toISOString().split('T')[0] : ''}
                                onChange={e => setFormData({ ...formData, start_date: e.target.value ? new Date(e.target.value) : null })}
                            />
                        </div>

                        {/* End Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha Fin</label>
                            <input
                                type="date"
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 bg-white dark:bg-[#2A3441] text-gray-900 dark:text-white"
                                value={formData.end_date ? formData.end_date.toISOString().split('T')[0] : ''}
                                onChange={e => setFormData({ ...formData, end_date: e.target.value ? new Date(e.target.value) : null })}
                            />
                        </div>

                        {/* Top Priority */}
                        <div className="flex items-center space-x-2 pt-6">
                            <input
                                type="checkbox"
                                id="is_top"
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded bg-white dark:bg-[#2A3441]"
                                checked={formData.is_top_priority}
                                onChange={e => setFormData({ ...formData, is_top_priority: e.target.checked })}
                            />
                            <label htmlFor="is_top" className="text-sm font-medium text-gray-900 dark:text-gray-200 flex items-center">
                                Top Priority ⭐
                            </label>
                        </div>



                        {/* Notes */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notas</label>
                            <textarea
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 bg-white dark:bg-[#2A3441] text-gray-900 dark:text-white"
                                rows={3}
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>

                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#2A3441] hover:bg-gray-50 dark:hover:bg-[#374151]"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {loading ? 'Guardando...' : 'Crear Iniciativa'}
                        </button>
                    </div>
                </form>
            </div>
        </div >
    );
};
