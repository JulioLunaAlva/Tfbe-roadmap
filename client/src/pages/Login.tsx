import React, { useState } from 'react';
import { Mail, ArrowRight, AlertCircle, CheckCircle, Lock } from 'lucide-react';

export const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json().catch(() => ({ error: 'Invalid JSON response from server' }));

            if (res.ok) {
                setSent(true);
                // DEV LOGIC: Since SMTP might be missing, show token in alert for ease of use
                if (data.token) {
                    // Login successful, using token directly
                    // Reload to update AuthContext or store token if manually handling
                    // For this simple implementation, we can update context if available, 
                    // but reloading or redirecting to /auth/callback?token=... simulates the flow.
                    // Actually, if we just want to login:
                    // window.localStorage.setItem('token', data.token); <--- IF we were using local storage
                    // But our AuthContext probably relies on the URL token mechanism or a cookie.
                    // Let's redirect to callback to "set" the token as if it came from magic link.
                    window.location.href = `/auth/callback?token=${data.token}`;
                }
            } else {
                setError(`Error ${res.status}: ${data.error || res.statusText}`);
            }
        } catch (err: any) {
            setError(`Network Error: ${err.message || 'Failed to connect'}`);
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
                <div className="w-full max-w-md p-8 bg-white dark:bg-[#1E2630] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 text-center animate-in fade-in zoom-in duration-300">
                    <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Email Enviado</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">Hemos enviado un enlace mágico a <strong>{email}</strong></p>
                    <p className="text-xs text-gray-400 mb-6 bg-gray-100 dark:bg-gray-800 p-2 rounded">
                        (Si no tienes configurado SMTP, revisa los logs de Vercel para ver el Link)
                    </p>
                    <button onClick={() => setSent(false)} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors">
                        Usar otro correo
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F4F4] dark:bg-[#0D1117] px-4">
            {/* Background Decoration */}
            <div className="fixed top-0 left-0 w-full h-1/2 bg-[#F40009] z-0 rounded-b-[3rem] shadow-2xl"></div>

            <div className="w-full max-w-md bg-white dark:bg-[#1E2630] rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 p-8 z-10 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-50 dark:bg-white rounded-2xl mb-4 shadow-sm">
                        {/* Use the new icon if available, generic fallback if not */}
                        <img src="/favicon.png" alt="Logo" className="w-12 h-12 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Bienvenido</h1>
                    <p className="text-gray-500 dark:text-gray-400">Transformación Finanzas - BE</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                        <div className="text-sm text-red-600 dark:text-red-400 break-words font-medium">
                            {error}
                        </div>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Usuario / Correo</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                required
                                className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-[#252D38] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F40009] focus:border-transparent transition-all"
                                placeholder="usuario o correo"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">Contraseña</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="password"
                                required
                                className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-[#252D38] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F40009] focus:border-transparent transition-all"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
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
                            <>
                                Iniciar Sesión <ArrowRight className="ml-2 w-5 h-5" />
                            </>
                        )}
                    </button>

                    <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
                        Acceso seguro vía Magic Link. No requiere contraseña.
                    </p>
                </form>
            </div>
            <div className="mt-8 text-center text-white/80 z-10 relative text-sm font-medium">
                &copy; {new Date().getFullYear()} KOF - Transformación Finanzas
            </div>
        </div>
    );
};
