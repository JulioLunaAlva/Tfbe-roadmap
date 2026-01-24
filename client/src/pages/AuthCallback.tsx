import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            // Decode token to get user info (simplified for MVP, ideally verify with backend /me first)
            // We will verify in App mount or AuthContext init, but here we just set it to unblock UI.
            // Better: Call /api/auth/me immediately to get user details.

            fetch('/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.user) {
                        login(token, data.user);
                        navigate('/');
                    } else {
                        navigate('/login?error=invalid_token');
                    }
                })
                .catch(() => navigate('/login?error=fetch_failed'));
        } else {
            navigate('/login');
        }
    }, [searchParams, login, navigate]);

    return <div className="p-8 text-center">Verifying login...</div>;
};
