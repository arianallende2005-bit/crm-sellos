import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-gray-800">CRM Sellos</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center text-gray-700">
                                <User className="h-5 w-5 mr-2" />
                                <span className="font-medium">{user?.fullName} ({user?.role})</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors"
                                title="Cerrar sesión"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {children}
            </main>
        </div>
    );
};
