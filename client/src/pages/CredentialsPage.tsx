import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config/api';
import { Plus, Edit2, Trash2, Key, Shield, User as UserIcon, X, Save, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';

interface User {
    id: string;
    email: string;
    role: 'admin' | 'editor' | 'viewer';
    created_at?: string;
}

export const CredentialsPage = () => {
    const { token } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'viewer' as 'admin' | 'editor' | 'viewer'
    });

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch users');
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            console.error(err);
            setError('No se pudieron cargar los usuarios. Verifica que tienes permisos.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [token]);

    const handleOpenModal = (mode: 'create' | 'edit', user?: User) => {
        setModalMode(mode);
        if (mode === 'edit' && user) {
            setEditingUser(user);
            setFormData({
                email: user.email,
                password: '', // Password empty on edit unless changing
                role: user.role
            });
        } else {
            setEditingUser(null);
            setFormData({
                email: '',
                password: '',
                role: 'viewer'
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = modalMode === 'create'
                ? `${API_URL}/api/users`
                : `${API_URL}/api/users/${editingUser?.id}`;

            const method = modalMode === 'create' ? 'POST' : 'PUT';

            // For edit, only send password if it's not empty
            const body: any = { role: formData.role };
            if (modalMode === 'create') {
                body.email = formData.email;
                body.password = formData.password;
            } else {
                if (formData.password) body.password = formData.password;
            }

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Operation failed');
            }

            // Success
            setIsModalOpen(false);
            fetchUsers();
            alert(modalMode === 'create' ? 'Usuario creado exitosamente' : 'Usuario actualizado exitosamente');

        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleDelete = async (id: string, email: string) => {
        if (!window.confirm(`¿Estás seguro de eliminar al usuario ${email}? Esta acción no se puede deshacer.`)) return;

        try {
            const res = await fetch(`${API_URL}/api/users/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Delete failed');
            }

            fetchUsers();
        } catch (err: any) {
            alert(err.message);
        }
    };

    return (
        <div className="container mx-auto max-w-6xl animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-[var(--text-primary)] flex items-center gap-3">
                        <Shield className="text-[#E10600] dark:text-[#FF3B30]" size={32} />
                        Gestión de Credenciales
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-2">
                        Administra los usuarios y permisos del sistema. Zona restringida.
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal('create')}
                    className="flex items-center gap-2 px-4 py-2 bg-[#E10600] text-white rounded-lg hover:bg-red-700 transition shadow-lg shadow-red-900/20 font-medium"
                >
                    <Plus size={20} />
                    Nuevo Usuario
                </button>
            </div>

            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow-sm" role="alert">
                    <p className="font-bold flex items-center gap-2"><AlertTriangle size={20} /> Error</p>
                    <p>{error}</p>
                </div>
            )}

            <div className="bg-[var(--bg-secondary)] rounded-xl shadow-xl border border-[var(--border-color)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[var(--bg-tertiary)] border-b border-[var(--border-color)]">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Usuario</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Email</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Rol</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-color)]">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-[var(--text-secondary)]">
                                        <div className="flex justify-center items-center gap-2">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#E10600]"></div>
                                            Cargando usuarios...
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-[var(--text-secondary)]">No hay usuarios registrados.</td>
                                </tr>
                            ) : (
                                users.map((u) => (
                                    <tr key={u.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-[var(--text-primary)] font-bold shadow-sm">
                                                    {u.email.charAt(0).toUpperCase()}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--text-primary)]">
                                            {u.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={clsx(
                                                "px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border",
                                                u.role === 'admin' ? "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-900" :
                                                    u.role === 'editor' ? "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-900" :
                                                        "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-900"
                                            )}>
                                                {u.role.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            <button
                                                onClick={() => handleOpenModal('edit', u)}
                                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-full transition"
                                                title="Editar"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(u.id, u.email)}
                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-[var(--bg-secondary)] rounded-2xl shadow-2xl w-full max-w-md border border-[var(--border-color)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-tertiary)]">
                            <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                                {modalMode === 'create' ? <Plus size={20} /> : <Edit2 size={20} />}
                                {modalMode === 'create' ? 'Crear Nuevo Usuario' : 'Editar Usuario'}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded-full hover:bg-black/5 transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <UserIcon size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        disabled={modalMode === 'edit'}
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="pl-10 block w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-3 py-2 text-sm focus:ring-2 focus:ring-[#E10600] outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                        placeholder="usuario@kof.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                    {modalMode === 'edit' ? 'Nueva Contraseña (dejar en blanco para no cambiar)' : 'Contraseña'}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Key size={16} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        required={modalMode === 'create'}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="pl-10 block w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-3 py-2 text-sm focus:ring-2 focus:ring-[#E10600] outline-none"
                                        placeholder="********"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Rol</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Shield size={16} className="text-gray-400" />
                                    </div>
                                    <select
                                        value={formData.role}
                                        onChange={(e: any) => setFormData({ ...formData, role: e.target.value })}
                                        className="pl-10 block w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-3 py-2 text-sm focus:ring-2 focus:ring-[#E10600] outline-none appearance-none"
                                    >
                                        <option value="viewer">Viewer (Solo lectura)</option>
                                        <option value="editor">Editor (Puede editar roadmap)</option>
                                        <option value="admin">Admin (Control total)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-[var(--border-color)] rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition text-sm font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#E10600] text-white rounded-md hover:bg-red-700 transition text-sm font-medium shadow-md flex items-center gap-2"
                                >
                                    <Save size={16} />
                                    {modalMode === 'create' ? 'Guardar Usuario' : 'Actualizar Usuario'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
