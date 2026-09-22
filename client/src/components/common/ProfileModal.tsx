import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserAvatar } from './UserAvatar';
import { X, User, Image, Check, AlertCircle } from 'lucide-react';

export const ProfileModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { user, updateUserProfile } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSaving(true);
        try {
            const result = await updateUserProfile({
                name: name.trim(),
                avatar_url: avatarUrl.trim()
            });

            if (result.success) {
                setSuccess(true);
                setTimeout(() => {
                    onClose();
                }, 800);
            } else {
                setError(result.error || 'No se pudo guardar el perfil');
            }
        } catch (err: any) {
            setError(err.message || 'Error inesperado');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-[#1a2332] rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md border border-gray-200/50 dark:border-gray-700/50 text-gray-900 dark:text-white">
                <button
                    onClick={onClose}
                    className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                >
                    <X size={18} />
                </button>

                <div className="flex flex-col items-center text-center mb-6">
                    <div className="relative mb-3">
                        <UserAvatar
                            name={name || user?.email}
                            imageUrl={avatarUrl}
                            size="xl"
                        />
                    </div>
                    <h2 className="text-lg font-bold">Perfil de Usuario</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{user?.email}</p>
                    <span className="mt-2 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                        {user?.role}
                    </span>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                        <AlertCircle size={14} className="flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 text-xs flex items-center gap-2">
                        <Check size={14} className="flex-shrink-0" />
                        <span>¡Perfil actualizado correctamente!</span>
                    </div>
                )}

                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <User size={13} />
                            Nombre o Alias
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej. Juan Perez"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#111827] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <Image size={13} />
                            URL de Foto de Perfil
                        </label>
                        <input
                            type="url"
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            placeholder="https://ejemplo.com/foto.jpg"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#111827] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition"
                        />
                        <p className="text-[11px] text-gray-400 mt-1">
                            Pega un enlace directo a tu imagen (JPG, PNG o WebP). Si se deja vacío o falla al cargar, se mostrarán tus iniciales automáticas.
                        </p>
                    </div>

                    {avatarUrl && (
                        <button
                            type="button"
                            onClick={() => setAvatarUrl('')}
                            className="text-xs text-indigo-500 hover:text-indigo-600 font-medium"
                        >
                            Quitar foto y usar iniciales
                        </button>
                    )}

                    <div className="flex gap-3 pt-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold transition flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                'Guardar Cambios'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
