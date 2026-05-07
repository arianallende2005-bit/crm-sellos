import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { OrderTable } from '../components/OrderTable';
import { CreateOrderModal } from '../components/CreateOrderModal';
import { ClientTable } from '../components/ClientTable';
import { CreateClientModal } from '../components/CreateClientModal';
import axios from 'axios';

interface StatCardProps {
    title: string;
    value: string | number;
    color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, color }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className={`mt-1 text-3xl font-semibold text-${color}-600`}>{value}</dd>
        </div>
    </div>
);

const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'orders' | 'clients'>('orders');
    const [stats, setStats] = useState({ activeOrders: 0, pending: 0, completed: 0 });

    // Orders state
    const [orders, setOrders] = useState([]);
    const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false);

    // Clients state
    const [clients, setClients] = useState([]);
    const [isCreateClientModalOpen, setIsCreateClientModalOpen] = useState(false);

    useEffect(() => {
        if (activeTab === 'orders') {
            fetchOrders();
        } else {
            fetchClients();
        }
    }, [activeTab]);

    const fetchOrders = async () => {
        try {
            const response = await axios.get('http://localhost:3001/api/orders');
            setOrders(response.data);
            const active = response.data.filter((o: any) => o.currentStatus < 5).length;
            const completed = response.data.filter((o: any) => o.currentStatus === 5).length;
            const pending = response.data.filter((o: any) => o.currentStatus === 1).length;
            setStats({ activeOrders: active, pending, completed });
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    };

    const fetchClients = async () => {
        try {
            const response = await axios.get('http://localhost:3001/api/users/clients');
            setClients(response.data);
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    return (
        <Layout>
            <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
                <StatCard title="Pedidos Activos" value={stats.activeOrders} color="indigo" />
                <StatCard title="Pendientes" value={stats.pending} color="yellow" />
                <StatCard title="Finalizados" value={stats.completed} color="green" />
            </div>

            <div className="bg-white shadow rounded-lg">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex">
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`${activeTab === 'orders'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm`}
                        >
                            Gestión de Pedidos
                        </button>
                        <button
                            onClick={() => setActiveTab('clients')}
                            className={`${activeTab === 'clients'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm`}
                        >
                            Gestión de Clientes
                        </button>
                    </nav>
                </div>
                <div className="p-6">
                    {activeTab === 'orders' ? (
                        <div>
                            <div className="flex justify-between mb-4">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Listado de Pedidos</h3>
                                <button
                                    onClick={() => setIsCreateOrderModalOpen(true)}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm"
                                >
                                    Nuevo Pedido
                                </button>
                            </div>
                            <OrderTable orders={orders} />
                        </div>
                    ) : (
                        <div>
                            <div className="flex justify-between mb-4">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Listado de Clientes</h3>
                                <button
                                    onClick={() => setIsCreateClientModalOpen(true)}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm"
                                >
                                    Nuevo Cliente
                                </button>
                            </div>
                            <ClientTable clients={clients} />
                        </div>
                    )}
                </div>
            </div>

            <CreateOrderModal
                isOpen={isCreateOrderModalOpen}
                onClose={() => setIsCreateOrderModalOpen(false)}
                onOrderCreated={fetchOrders}
            />

            <CreateClientModal
                isOpen={isCreateClientModalOpen}
                onClose={() => setIsCreateClientModalOpen(false)}
                onClientCreated={fetchClients}
            />
        </Layout>
    );
};

export default AdminDashboard;
