import React, { useState } from 'react';
import { Lock, ArrowRight, AlertCircle, CheckCircle, Eye, EyeOff, ShieldCheck, Bot, LineChart } from 'lucide-react';
import API_URL from '../config/api';
import { useAuth } from '../context/AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// ForcedChangePage – shown when user logs in with must_change_password = true
// ─────────────────────────────────────────────────────────────────────────────
export const ForcedChangePasswordPage = () => {
    const { user, tempToken, confirmPasswordChange, logout } = useAuth();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const strength = newPassword.length === 0 ? 0
        : newPassword.length < 6 ? 1
        : newPassword.length < 8 ? 2
        : /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) ? 4 : 3;

    const strengthLabel = ['', 'Muy débil', 'Débil', 'Buena', 'Fuerte'];
    const strengthColor = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }
        if (newPassword.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/api/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${tempToken}`
                },
                body: JSON.stringify({ newPassword })
            });
            const data = await res.json();
            if (res.ok && data.token) {
                confirmPasswordChange(data.token, data.user);
                // Redirect to app root
                window.location.href = import.meta.env.BASE_URL || '/';
            } else {
                setError(data.error || 'Error al cambiar la contraseña');
            }
        } catch (err: any) {
            setError(`Error de red: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F4F4] dark:bg-[#0D1117] px-4">
            {/* Background Decoration */}
            <div className="fixed top-0 left-0 w-full h-1/2 bg-[#F40009] z-0 rounded-b-[3rem] shadow-2xl"></div>

            <div className="w-full max-w-md bg-white dark:bg-[#1E2630] rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 p-8 z-10 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-[#E10600] to-red-900 rounded-3xl mb-6 shadow-lg shadow-red-900/30 relative">
                        <Bot size={48} className="text-white drop-shadow-md" />
                        <div className="absolute -bottom-2 -right-2 bg-blue-600 rounded-full p-1.5 border-4 border-white dark:border-[#1E2630] shadow-md">
                            <LineChart size={20} className="text-white" />
                        </div>
                    </div>
                    <div className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-bold px-3 py-1 rounded-full border border-orange-200 dark:border-orange-800 mb-4">
                        <ShieldCheck size={14} />
                        Cambio de contraseña requerido
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Crea tu nueva contraseña</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Hola <span className="font-semibold text-gray-700 dark:text-gray-300">{user?.email}</span>,<br />
                        un administrador ha solicitado que cambies tu contraseña.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                        <div className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* New Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Nueva contraseña</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type={showNew ? 'text' : 'password'}
                                required
                                className="block w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-[#252D38] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F40009] focus:border-transparent transition-all"
                                placeholder="Mínimo 8 caracteres"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {/* Strength meter */}
                        {newPassword.length > 0 && (
                            <div className="mt-2 space-y-1">
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor[strength] : 'bg-gray-200 dark:bg-gray-700'}`} />
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500">{strengthLabel[strength]}</p>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Confirmar contraseña</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                {confirmPassword && newPassword === confirmPassword
                                    ? <CheckCircle className="h-5 w-5 text-green-500" />
                                    : <Lock className="h-5 w-5 text-gray-400" />
                                }
                            </div>
                            <input
                                type={showConfirm ? 'text' : 'password'}
                                required
                                className={`block w-full pl-10 pr-10 py-3 border rounded-xl bg-gray-50 dark:bg-[#252D38] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                                    confirmPassword && newPassword !== confirmPassword
                                        ? 'border-red-400 focus:ring-red-400'
                                        : confirmPassword && newPassword === confirmPassword
                                        ? 'border-green-400 focus:ring-green-400'
                                        : 'border-gray-200 dark:border-gray-700 focus:ring-[#F40009] focus:border-transparent'
                                }`}
                                placeholder="Repite la contraseña"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-red-500/30 text-base font-bold text-white bg-[#F40009] hover:bg-[#D30008] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F40009] disabled:opacity-70 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>Guardar y entrar <ArrowRight className="ml-2 w-5 h-5" /></>
                        )}
                    </button>
                    <button type="button" onClick={logout} className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors">
                        Cancelar e iniciar sesión con otra cuenta
                    </button>
                </form>
            </div>
            <div className="mt-8 text-center text-white/80 z-10 relative text-sm font-medium">
                &copy; {new Date().getFullYear()} TF
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// ChangePasswordModal – self-service modal opened from the sidebar
// ─────────────────────────────────────────────────────────────────────────────
interface ChangePasswordModalProps {
    onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose }) => {
    const { token } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const strength = newPassword.length === 0 ? 0
        : newPassword.length < 6 ? 1
        : newPassword.length < 8 ? 2
        : /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) ? 4 : 3;
    const strengthLabel = ['', 'Muy débil', 'Débil', 'Buena', 'Fuerte'];
    const strengthColor = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) { setError('Las contraseñas no coinciden'); return; }
        if (newPassword.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }

        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/api/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess(true);
                setTimeout(onClose, 2000);
            } else {
                setError(data.error || 'Error al cambiar la contraseña');
            }
        } catch (err: any) {
            setError(`Error de red: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[var(--bg-secondary)] rounded-2xl shadow-2xl w-full max-w-sm border border-[var(--border-color)] overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)] flex justify-between items-center">
                    <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <Lock size={18} className="text-[#E10600]" />
                        Cambiar contraseña
                    </h3>
                    <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded-full hover:bg-black/5 transition text-lg leading-none">&times;</button>
                </div>

                {success ? (
                    <div className="p-8 flex flex-col items-center text-center gap-3">
                        <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                            <CheckCircle className="text-green-600 dark:text-green-400" size={28} />
                        </div>
                        <p className="font-semibold text-[var(--text-primary)]">¡Contraseña actualizada!</p>
                        <p className="text-sm text-[var(--text-secondary)]">Tu contraseña ha sido cambiada exitosamente.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                {error}
                            </div>
                        )}

                        {/* Current Password */}
                        <div>
                            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Contraseña actual</label>
                            <div className="relative">
                                <input
                                    type={showCurrent ? 'text' : 'password'}
                                    required
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                    className="block w-full pl-3 pr-10 py-2.5 text-sm border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#E10600] transition"
                                    placeholder="Tu contraseña actual"
                                />
                                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
                                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div>
                            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Nueva contraseña</label>
                            <div className="relative">
                                <input
                                    type={showNew ? 'text' : 'password'}
                                    required
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="block w-full pl-3 pr-10 py-2.5 text-sm border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#E10600] transition"
                                    placeholder="Mínimo 8 caracteres"
                                />
                                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
                                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {newPassword.length > 0 && (
                                <div className="mt-1.5 space-y-1">
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor[strength] : 'bg-gray-200 dark:bg-gray-700'}`} />
                                        ))}
                                    </div>
                                    <p className="text-xs text-[var(--text-secondary)]">{strengthLabel[strength]}</p>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Confirmar contraseña</label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    required
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className={`block w-full pl-3 pr-10 py-2.5 text-sm border rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 transition ${
                                        confirmPassword && newPassword !== confirmPassword ? 'border-red-400 focus:ring-red-400' :
                                        confirmPassword && newPassword === confirmPassword ? 'border-green-400 focus:ring-green-400' :
                                        'border-[var(--border-color)] focus:ring-[#E10600]'
                                    }`}
                                    placeholder="Repite la nueva contraseña"
                                />
                                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
                                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={onClose}
                                className="flex-1 py-2.5 text-sm font-medium border border-[var(--border-color)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition">
                                Cancelar
                            </button>
                            <button type="submit" disabled={loading}
                                className="flex-1 py-2.5 text-sm font-bold bg-[#E10600] text-white rounded-lg hover:bg-red-700 disabled:opacity-60 transition flex items-center justify-center gap-2">
                                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Actualizar'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
