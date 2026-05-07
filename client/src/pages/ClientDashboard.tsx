import React, { useEffect } from 'react';
import { Layout } from '../components/Layout';

const ClientDashboard: React.FC = () => {
    useEffect(() => {
        // fetch orders
    }, []);

    return (
        <Layout>
            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Mis Pedidos</h2>
                <p className="text-gray-600">Aquí podrás ver el estado de tus sellos.</p>
                {/* Tabla de pedidos del cliente */}
            </div>
        </Layout>
    );
};

export default ClientDashboard;
