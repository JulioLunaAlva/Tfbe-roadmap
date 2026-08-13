import React, { createContext, useContext, useState, useEffect } from 'react';
import API_URL from '../config/api';

interface User {
    email: string;
    role: 'admin' | 'editor' | 'viewer';
    allowed_pages?: string[];
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    mustChangePassword: boolean;
    tempToken: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isLoading: boolean;
    triggerMustChangePassword: (tempToken: string, email: string) => void;
    confirmPasswordChange: (token: string, user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);
    const [mustChangePassword, setMustChangePassword] = useState(false);
    const [tempToken, setTempToken] = useState<string | null>(null);

    // Shared function to fetch fresh user from server
    const refreshUser = async (currentToken: string) => {
        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out')), 5000)
            );
            const res = await Promise.race([
                fetch(`${API_URL}/api/auth/me`, {
                    headers: { Authorization: `Bearer ${currentToken}` }
                }),
                timeoutPromise
            ]) as Response;

            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
                return true;
            } else {
                logout();
                return false;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            logout();
            return false;
        }
    };

    // On mount: verify token and load fresh user + permissions from DB
    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                await refreshUser(token);
            }
            setIsLoading(false);
        };
        initAuth();
    }, [token]);

    // Refresh permissions silently when user returns to this tab
    // This ensures permission changes take effect without requiring logout
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && token) {
                refreshUser(token);
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [token]);


    const login = (newToken: string, newUser: User) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(newUser);
        setMustChangePassword(false);
        setTempToken(null);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setMustChangePassword(false);
        setTempToken(null);
    };

    // Called when login API responds with must_change_password: true
    const triggerMustChangePassword = (tmpToken: string, email: string) => {
        setTempToken(tmpToken);
        setMustChangePassword(true);
        // Set a minimal user so the change-password page can display the email
        setUser({ email, role: 'viewer' });
    };

    // Called after successful password change – completes full login
    const confirmPasswordChange = (newToken: string, newUser: User) => {
        login(newToken, newUser);
    };

    return (
        <AuthContext.Provider value={{
            user, token, mustChangePassword, tempToken,
            login, logout, isLoading,
            triggerMustChangePassword, confirmPasswordChange
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
