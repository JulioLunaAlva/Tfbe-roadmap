import { useState, useEffect } from 'react';
import { Save, Trash2, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import API_URL from '../../config/api';

interface DashboardLayout {
    id: number;
    name: string;
    is_active: boolean;
    created_at: string;
}

interface Props {
    token: string;
    currentOrder: string[];
    currentSizes: Record<string, number>;
    onLayoutSelected: (order: string[], sizes: Record<string, number>) => void;
}

export const DashboardLayoutManager = ({ token, currentOrder, currentSizes, onLayoutSelected }: Props) => {
    const [isOpen, setIsOpen] = useState(false);
    const [layouts, setLayouts] = useState<DashboardLayout[]>([]);
    const [newLayoutName, setNewLayoutName] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const fetchLayouts = async () => {
        try {
            const res = await fetch(`${API_URL}/api/dashboard/layouts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setLayouts(data);
            }
        } catch (error) {
            console.error('Error fetching layouts:', error);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchLayouts();
        }
    }, [isOpen]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLayoutName.trim()) return;

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/dashboard/layouts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newLayoutName,
                    layout_data: { order: currentOrder, sizes: currentSizes },
                    activate: true
                })
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Layout guardado y activado globalmente' });
                setNewLayoutName('');
                fetchLayouts();
                setTimeout(() => setMessage(null), 3000);
            } else {
                setMessage({ type: 'error', text: 'Error al guardar layout' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error de conexión' });
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async (id: number) => {
        try {
            const res = await fetch(`${API_URL}/api/dashboard/layouts/${id}/activate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ active: true })
            });

            if (res.ok) {
                const updated = await res.json();
                onLayoutSelected(updated.layout_data.order, updated.layout_data.sizes);
                fetchLayouts();
                setMessage({ type: 'success', text: 'Layout global activado' });
                setTimeout(() => setMessage(null), 2000);
            }
        } catch (error) {
            console.error('Error activating layout:', error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('¿Estás seguro de eliminar este layout?')) return;

        try {
            const res = await fetch(`${API_URL}/api/dashboard/layouts/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                fetchLayouts();
            }
        } catch (error) {
            console.error('Error deleting layout:', error);
        }
    };

    return (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-sm overflow-hidden mb-6">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--bg-tertiary)] transition-colors"
            >
                <div className="flex items-center space-x-2">
                    <Save size={18} className="text-indigo-500" />
                    <span className="font-semibold text-[var(--text-primary)] text-sm">Gestionar Layouts Globales (Cesar)</span>
                </div>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {isOpen && (
                <div className="p-4 border-t border-[var(--border-color)] space-y-4 animate-in slide-in-from-top-2 duration-200">
                    {/* Save Current Layout */}
                    <form onSubmit={handleSave} className="flex space-x-2">
                        <input 
                            type="text" 
                            placeholder="Nombre del diseño (ej: Estratégico)"
                            value={newLayoutName}
                            onChange={(e) => setNewLayoutName(e.target.value)}
                            className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                            required
                        />
                        <button 
                            type="submit"
                            disabled={loading}
                            className="bg-indigo-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-1"
                        >
                            <Save size={14} />
                            <span>{loading ? 'Guardando...' : 'Guardar y Activar'}</span>
                        </button>
                    </form>

                    {message && (
                        <div className={`text-xs p-2 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}

                    {/* saved Layouts List */}
                    <div className="space-y-2">
                        <h4 className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] tracking-wider">Diseños Guardados</h4>
                        {layouts.length === 0 ? (
                            <p className="text-xs text-[var(--text-tertiary)] italic">No hay diseños guardados aún.</p>
                        ) : (
                            <div className="grid gap-2">
                                {layouts.map(layout => (
                                    <div key={layout.id} className={`flex items-center justify-between p-2 rounded-md border ${layout.is_active ? 'border-green-200 bg-green-50/30' : 'border-[var(--border-color)] bg-[var(--bg-tertiary)]'}`}>
                                        <div className="flex items-center space-x-2">
                                            {layout.is_active && <CheckCircle size={14} className="text-green-500" />}
                                            <span className={`text-sm font-medium ${layout.is_active ? 'text-green-700' : 'text-[var(--text-primary)]'}`}>
                                                {layout.name}
                                            </span>
                                            <span className="text-[10px] text-[var(--text-tertiary)]">
                                                {new Date(layout.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            {!layout.is_active && (
                                                <button 
                                                    onClick={() => handleActivate(layout.id)}
                                                    className="p-1 hover:text-green-600 text-gray-400 transition-colors"
                                                    title="Activar para todos"
                                                >
                                                    <CheckCircle size={14} />
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handleDelete(layout.id)}
                                                className="p-1 hover:text-red-500 text-gray-400 transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
