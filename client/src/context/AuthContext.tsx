import React, { createContext, useContext, useState, useEffect } from 'react';
import API_URL from '../config/api';

interface User {
    email: string;
    role: 'admin' | 'editor' | 'viewer';
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                try {
                    // Create a timeout promise that rejects after 5 seconds
                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Request timed out')), 5000)
                    );

                    // Race between fetch and timeout
                    const res = await Promise.race([
                        fetch(`${API_URL}/api/auth/me`, {
                            headers: { Authorization: `Bearer ${token}` }
                        }),
                        timeoutPromise
                    ]) as Response;

                    if (res.ok) {
                        const data = await res.json();
                        setUser(data.user);
                    } else {
                        // Token invalid or expired
                        logout();
                    }
                } catch (error) {
                    console.error('Auth check failed:', error);
                    // On timeout or network error, logout to prevent hanging
                    logout();
                }
            }
            // Always finish loading
            setIsLoading(false);
        };
        initAuth();
    }, [token]);

    const login = (newToken: string, newUser: User) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(newUser);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
