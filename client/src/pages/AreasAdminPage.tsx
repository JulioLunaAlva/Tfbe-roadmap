import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Users, Building2, X, Save, UserPlus, UserMinus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useArea, type BusinessArea } from '../context/AreaContext';
import API_URL from '../config/api';
import { clsx } from 'clsx';

interface AreaWithCount extends BusinessArea {
    initiative_count?: number;
}

interface AreaUser {
    id: string;
    email: string;
    role: string;
    can_edit: boolean;
    access_id: string;
}

const COLOR_OPTIONS = [
    '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6',
    '#8b5cf6', '#f97316', '#14b8a6', '#ec4899', '#64748b'
];

export const AreasAdminPage: React.FC = () => {
    const { token } = useAuth();
    const { refreshAreas } = useArea();
    const [areas, setAreas] = useState<AreaWithCount[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedArea, setSelectedArea] = useState<AreaWithCount | null>(null);
    const [areaUsers, setAreaUsers] = useState<AreaUser[]>([]);
    const [allUsers, setAllUsers] = useState<{ id: string; email: string }[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showUsersPanel, setShowUsersPanel] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserCanEdit, setNewUserCanEdit] = useState(false);

    const [form, setForm] = useState({
        slug: '', name: '', description: '', color: '#6366f1', icon: 'Building2', display_order: 0
    });

    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    const fetchAreas = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/areas/all`, { headers });
            if (res.ok) setAreas(await res.json());
        } finally {
            setLoading(false);
        }
    };

    const fetchAllUsers = async () => {
        const res = await fetch(`${API_URL}/api/users`, { headers });
        if (res.ok) setAllUsers(await res.json());
    };

    useEffect(() => { fetchAreas(); fetchAllUsers(); }, []);

    const fetchAreaUsers = async (areaId: string) => {
        const res = await fetch(`${API_URL}/api/areas/${areaId}/users`, { headers });
        if (res.ok) setAreaUsers(await res.json());
    };

    const handleCreate = async () => {
        if (!form.name || !form.slug) return;
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/api/areas`, {
                method: 'POST', headers,
                body: JSON.stringify(form)
            });
            if (res.ok) {
                setShowCreateModal(false);
                setForm({ slug: '', name: '', description: '', color: '#6366f1', icon: 'Building2', display_order: 0 });
                await fetchAreas();
                refreshAreas();
            } else {
                const err = await res.json();
                alert(err.error || 'Error al crear area');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async () => {
        if (!selectedArea) return;
        setSaving(true);
        try {
            const res = await fetch(`${API_URL}/api/areas/${selectedArea.id}`, {
                method: 'PUT', headers,
                body: JSON.stringify(form)
            });
            if (res.ok) {
                setShowEditModal(false);
                await fetchAreas();
                refreshAreas();
            }
        } finally {
            setSaving(false);
        }
    };

    const handleGrantAccess = async () => {
        if (!selectedArea || !newUserEmail) return;
        const user = allUsers.find(u => u.email === newUserEmail);
        if (!user) { alert('Usuario no encontrado'); return; }

        const res = await fetch(`${API_URL}/api/areas/${selectedArea.id}/users`, {
            method: 'POST', headers,
            body: JSON.stringify({ user_id: user.id, can_edit: newUserCanEdit })
        });
        if (res.ok) {
            await fetchAreaUsers(selectedArea.id);
            setNewUserEmail('');
            setNewUserCanEdit(false);
        }
    };

    const handleRevokeAccess = async (userId: string) => {
        if (!selectedArea) return;
        const res = await fetch(`${API_URL}/api/areas/${selectedArea.id}/users/${userId}`, {
            method: 'DELETE', headers
        });
        if (res.ok) await fetchAreaUsers(selectedArea.id);
    };

    const openEditModal = (area: AreaWithCount) => {
        setSelectedArea(area);
        setForm({
            slug: area.slug, name: area.name, description: area.description || '',
            color: area.color, icon: area.icon, display_order: area.display_order
        });
        setShowEditModal(true);
    };

    const openUsersPanel = async (area: AreaWithCount) => {
        setSelectedArea(area);
        setShowUsersPanel(true);
        await fetchAreaUsers(area.id);
    };

    const AreaFormModal = ({ title, onSave, onClose }: { title: string; onSave: () => void; onClose: () => void }) => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-6 w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Slug (ID unico, sin espacios)</label>
                        <input
                            value={form.slug}
                            onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                            placeholder="ej: grc, logistics, marketing"
                            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Nombre del area</label>
                        <input
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="ej: Gestion Riesgos y Controles"
                            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Descripcion</label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-indigo-500 resize-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">Color del area</label>
                        <div className="flex gap-2 flex-wrap">
                            {COLOR_OPTIONS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setForm(f => ({ ...f, color: c }))}
                                    className={clsx('w-7 h-7 rounded-full border-2 transition-transform hover:scale-110', form.color === c ? 'border-white scale-110' : 'border-transparent')}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Orden de visualizacion</label>
                        <input
                            type="number"
                            value={form.display_order}
                            onChange={e => setForm(f => ({ ...f, display_order: parseInt(e.target.value) || 0 }))}
                            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancelar</button>
                    <button
                        onClick={onSave}
                        disabled={saving || !form.name || !form.slug}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
                    >
                        <Save size={14} />
                        {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-full px-4 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-100">Gestion de Areas</h2>
                    <p className="text-sm text-gray-400 mt-0.5">Administra las areas de negocio y sus accesos</p>
                </div>
                <button
                    onClick={() => { setForm({ slug: '', name: '', description: '', color: '#6366f1', icon: 'Building2', display_order: areas.length }); setShowCreateModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors"
                >
                    <Plus size={16} /> Nueva Area
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {areas.map(area => (
                        <div
                            key={area.id}
                            className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-5 hover:border-indigo-500/50 transition-all"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: area.color + '22' }}>
                                        <span className="w-4 h-4 rounded-full" style={{ backgroundColor: area.color, display: 'block' }} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-[var(--text-primary)] text-sm leading-tight">{area.name}</h3>
                                        <p className="text-xs text-gray-500 font-mono">/{area.slug}</p>
                                    </div>
                                </div>
                                <span className={clsx(
                                    'text-xs px-2 py-0.5 rounded-full font-medium',
                                    area.is_active ? 'bg-green-500/15 text-green-400' : 'bg-gray-500/15 text-gray-400'
                                )}>
                                    {area.is_active ? 'Activa' : 'Inactiva'}
                                </span>
                            </div>

                            {area.description && (
                                <p className="text-xs text-gray-400 mb-3 line-clamp-2">{area.description}</p>
                            )}

                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                                <Building2 size={12} />
                                <span>{area.initiative_count ?? 0} iniciativas</span>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => openEditModal(area)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[var(--bg-primary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] transition-colors"
                                >
                                    <Pencil size={12} /> Editar
                                </button>
                                <button
                                    onClick={() => openUsersPanel(area)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[var(--bg-primary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] transition-colors"
                                >
                                    <Users size={12} /> Usuarios
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <AreaFormModal title="Nueva Area" onSave={handleCreate} onClose={() => setShowCreateModal(false)} />
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <AreaFormModal title="Editar Area" onSave={handleUpdate} onClose={() => setShowEditModal(false)} />
            )}

            {/* Users Side Panel */}
            {showUsersPanel && selectedArea && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowUsersPanel(false)} />
                    <div className="relative bg-[var(--bg-secondary)] border-l border-[var(--border-color)] w-full max-w-md h-full overflow-y-auto shadow-2xl">
                        <div className="p-5 border-b border-[var(--border-color)]">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-[var(--text-primary)]">Usuarios con acceso</h3>
                                    <p className="text-sm text-gray-400">{selectedArea.name}</p>
                                </div>
                                <button onClick={() => setShowUsersPanel(false)} className="text-gray-400 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="p-5 border-b border-[var(--border-color)]">
                            <h4 className="text-sm font-medium text-gray-300 mb-3">Otorgar acceso</h4>
                            <div className="space-y-3">
                                <select
                                    value={newUserEmail}
                                    onChange={e => setNewUserEmail(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-indigo-500"
                                >
                                    <option value="">Seleccionar usuario...</option>
                                    {allUsers
                                        .filter(u => !areaUsers.some(au => au.email === u.email))
                                        .map(u => <option key={u.id} value={u.email}>{u.email}</option>)
                                    }
                                </select>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={newUserCanEdit}
                                        onChange={e => setNewUserCanEdit(e.target.checked)}
                                        className="w-4 h-4 rounded accent-indigo-500"
                                    />
                                    <span className="text-sm text-gray-300">Puede editar (editor)</span>
                                </label>
                                <button
                                    onClick={handleGrantAccess}
                                    disabled={!newUserEmail}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors w-full justify-center"
                                >
                                    <UserPlus size={14} /> Otorgar Acceso
                                </button>
                            </div>
                        </div>

                        <div className="p-5">
                            <h4 className="text-sm font-medium text-gray-300 mb-3">Usuarios actuales ({areaUsers.length})</h4>
                            {areaUsers.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">Ningun usuario asignado</p>
                            ) : (
                                <div className="space-y-2">
                                    {areaUsers.map(u => (
                                        <div key={u.access_id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)]">
                                            <div>
                                                <p className="text-sm font-medium text-[var(--text-primary)]">{u.email}</p>
                                                <p className="text-xs text-gray-500">{u.can_edit ? 'Editor' : 'Viewer'} - {u.role}</p>
                                            </div>
                                            <button
                                                onClick={() => handleRevokeAccess(u.id)}
                                                className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                                                title="Revocar acceso"
                                            >
                                                <UserMinus size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
