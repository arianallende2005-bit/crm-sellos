import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { X } from 'lucide-react';

interface Client {
    id: number;
    username: string;
    fullName: string | null;
}

interface CreateOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOrderCreated: () => void;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({ isOpen, onClose, onOrderCreated }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [productName, setProductName] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [deliveryDate, setDeliveryDate] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchClients();
        }
    }, [isOpen]);

    const fetchClients = async () => {
        try {
            const response = await api.get('/users/clients');
            // Filter to only show clients? Or backend does it? Backend `getUsers` usually returns all.
            // Assuming we want to filter by role 'cliente' if the backend returns role.
            // For now, let's assume the backend endpoint exists and returns users.
            setClients(response.data.filter((u: any) => u.role === 'cliente'));
        } catch (err) {
            console.error('Error fetching clients:', err);
            setError('Error cargando clientes');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/orders', {
                clientId: parseInt(selectedClientId),
                productName,
                imageUrl,
                deliveryDate: deliveryDate ? deliveryDate : undefined
            });
            onOrderCreated();
            onClose();
            // Reset form
            setProductName('');
            setImageUrl('');
            setDeliveryDate('');
            setSelectedClientId('');
        } catch (err) {
            console.error('Error creating order:', err);
            setError('Error al crear el pedido');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Nuevo Pedido</h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Cliente</label>
                                <select
                                    required
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                    value={selectedClientId}
                                    onChange={(e) => setSelectedClientId(e.target.value)}
                                >
                                    <option value="">Seleccione un cliente</option>
                                    {clients.map((client) => (
                                        <option key={client.id} value={client.id}>
                                            {client.fullName || client.username} ({client.username})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Producto</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 flex-1 block w-full min-w-0 rounded-none rounded-r-md sm:text-sm border-gray-300"
                                    placeholder="Nombre del sello"
                                    value={productName}
                                    onChange={(e) => setProductName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">URL Imagen (Opcional)</label>
                                <input
                                    type="text"
                                    className="mt-1 flex-1 block w-full min-w-0 rounded-md sm:text-sm border-gray-300"
                                    placeholder="https://..."
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Fecha de Entrega (Opcional)</label>
                                <input
                                    type="date"
                                    className="mt-1 flex-1 block w-full min-w-0 rounded-md sm:text-sm border-gray-300"
                                    value={deliveryDate}
                                    onChange={(e) => setDeliveryDate(e.target.value)}
                                />
                            </div>

                            <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                <button
                                    type="submit"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
                                >
                                    Crear
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                                    onClick={onClose}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
