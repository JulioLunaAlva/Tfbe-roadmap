
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config/api';
import { SupportModal, type SupportItem } from '../components/support/SupportModal';
import { Plus, Edit2, Trash2, LifeBuoy } from 'lucide-react';

const COLUMNS = ['BE', 'D&A', 'BE & D&A', 'BE & TERCEROS'];

export const SupportPage = () => {
    const { token, user } = useAuth();
    const [items, setItems] = useState<SupportItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<SupportItem | undefined>(undefined);

    const canEdit = user?.role === 'admin' || user?.role === 'editor';

    const fetchItems = async () => {
        try {
            const res = await fetch(`${API_URL}/api/support`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) setItems(data);
        } catch (error) {
            console.error('Error fetching support items:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchItems();
    }, [token]);

    const handleSave = async (item: SupportItem) => {
        const method = item.id ? 'PUT' : 'POST';
        const url = item.id ? `${API_URL}/api/support/${item.id}` : `${API_URL}/api/support`;

        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(item)
        });

        if (res.ok) fetchItems();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este ítem?')) return;

        await fetch(`${API_URL}/api/support/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        fetchItems();
    };

    const openNew = () => {
        setEditingItem(undefined);
        setIsModalOpen(true);
    };

    const openEdit = (item: SupportItem) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center bg-white dark:bg-[#1E2630] p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                        <LifeBuoy size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Soporte y Mantenimiento</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Gestión de iniciativas en soporte activo</p>
                    </div>
                </div>
                {canEdit && (
                    <button
                        onClick={openNew}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
                    >
                        <Plus size={18} />
                        <span>Nueva Iniciativa</span>
                    </button>
                )}
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto">
                <div className="flex gap-4 min-w-[1000px] h-full pb-2">
                    {COLUMNS.map(col => (
                        <div key={col} className="flex-1 min-w-[280px] flex flex-col bg-gray-50 dark:bg-[#111827/50] rounded-xl border border-gray-200 dark:border-gray-800">
                            {/* Column Header */}
                            <div className="p-3 border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-[#1E2630]/50 rounded-t-xl backdrop-blur-sm sticky top-0 z-10">
                                <h3 className="font-bold text-gray-700 dark:text-gray-200 text-center uppercase tracking-wide text-sm flex items-center justify-center gap-2">
                                    {col}
                                    <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs">
                                        {items.filter(i => i.responsible === col).length}
                                    </span>
                                </h3>
                            </div>

                            {/* Cards Container */}
                            <div className="p-3 flex-1 overflow-y-auto space-y-3">
                                {loading ? (
                                    <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div></div>
                                ) : (
                                    items
                                        .filter(i => i.responsible === col)
                                        .map(item => (
                                            <div key={item.id} className="bg-white dark:bg-[#1E2630] p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow group relative">
                                                <div className="mb-2">
                                                    <div className="flex justify-between items-start">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${item.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                            item.status === 'On Hold' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                                'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                                            }`}>
                                                            {item.status === 'Active' ? 'Activo' : item.status === 'On Hold' ? 'En Espera' : 'Completado'}
                                                        </span>
                                                        {canEdit && (
                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => openEdit(item)} className="p-1 text-gray-400 hover:text-blue-500"><Edit2 size={14} /></button>
                                                                <button onClick={() => handleDelete(item.id!)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <h4 className="font-bold text-gray-800 dark:text-gray-100 mt-2 leading-tight">{item.name}</h4>
                                                </div>

                                                <div className="space-y-1.5 mt-3">
                                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                        <span className="font-semibold text-gray-400 uppercase text-[10px]">Área:</span>
                                                        <span className="truncate">{item.area}</span>
                                                    </div>
                                                    {item.technology && (
                                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                            <span className="font-semibold text-gray-400 uppercase text-[10px]">Tech:</span>
                                                            <span className="truncate">{item.technology}</span>
                                                        </div>
                                                    )}
                                                    {item.champion && (
                                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                            <span className="font-semibold text-gray-400 uppercase text-[10px]">Champ:</span>
                                                            <span className="truncate">{item.champion}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <SupportModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={editingItem}
            />
        </div>
    );
};
