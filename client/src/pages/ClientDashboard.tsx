import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import axios from 'axios';

const ClientDashboard: React.FC = () => {
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        // fetch orders
    }, []);

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Mis Pedidos</h2>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {/* Map orders here */}
                    <li className="px-4 py-4 sm:px-6 text-gray-500 text-center">
                        No tienes pedidos activos.
                    </li>
                </ul>
            </div>
        </Layout>
    );
};

export default ClientDashboard;
