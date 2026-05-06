import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check if user is already logged in on mount
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await authAPI.getCurrentUser();
            if (response.data.success) {
                setUser(response.data.user);
            }
        } catch (err) {
            // User not authenticated or token expired
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, password) => {
        try {
            setError(null);
            const response = await authAPI.login({ username, password });

            if (response.data.success) {
                if (response.data.token) {
                    localStorage.setItem('token', response.data.token);
                }
                setUser(response.data.user);
                return { success: true, user: response.data.user };
            }

            return { success: false, message: response.data.message };
        } catch (err) {
            const message = err.response?.data?.message || 'Error al iniciar sesión';
            setError(message);
            return { success: false, message };
        }
    };

    const logout = async () => {
        try {
            await authAPI.logout();
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            localStorage.removeItem('token');
            setUser(null);
            window.location.href = '/login';
        }
    };

    const isAdmin = () => {
        return user?.role === 'admin';
    };

    const isClient = () => {
        return user?.role === 'cliente';
    };

    const value = {
        user,
        loading,
        error,
        login,
        logout,
        isAdmin,
        isClient,
        setUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export default AuthContext;
