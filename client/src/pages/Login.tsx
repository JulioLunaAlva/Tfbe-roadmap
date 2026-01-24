import React, { useState } from 'react';

export const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (res.ok) {
                setSent(true);
                // DEV ONLY: For MVP, show token since we only log it
                if (data.token) {
                    console.log("DEV TOKEN:", data.token);
                    alert(`DEV MODE: Magic Link Token logged in console.\nToken: ${data.token}`);
                    // In a real app, user checks email. 
                    // Here we can auto-redirect to verify for convenience if we wanted, 
                    // but let's simulate the link click by asking user to go to /auth/callback?token=...
                }
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert('Login failed');
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="p-8 bg-white rounded shadow-md text-center max-w-md">
                    <h2 className="text-2xl font-bold mb-4">Check your email</h2>
                    <p className="text-gray-600 mb-4">We sent a magic link to {email}.</p>
                    <p className="text-xs text-gray-400">(Dev Mode: Check browser console or server logs for the token)</p>
                    <button onClick={() => setSent(false)} className="text-indigo-600 hover:underline">
                        Try another email
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="w-full max-w-md p-8 bg-white rounded shadow-md">
                <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">TFBE Roadmap</h1>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email Address</label>
                        <input
                            type="email"
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@company.com"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                    >
                        {loading ? 'Sending...' : 'Send Magic Link'}
                    </button>
                </form>
            </div>
        </div>
    );
};
