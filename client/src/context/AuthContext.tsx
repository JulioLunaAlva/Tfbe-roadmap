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
