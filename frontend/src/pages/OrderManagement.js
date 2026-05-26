import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI, usersAPI, STATIC_URL } from '../services/api';
import { FiArrowLeft, FiPlus, FiUpload, FiTrash2, FiSearch, FiDownload, FiArchive, FiEdit2 } from 'react-icons/fi';
import StatusBadge from '../components/StatusBadge';
import OrderTimeline from '../components/OrderTimeline';
import styles from './OrderManagement.module.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const OrderManagement = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [clients, setClients] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [formData, setFormData] = useState({
        client_id: '',
        product_name: '',
        delivery_date: '',
        image: null
    });
    const [updateData, setUpdateData] = useState({
        status: '',
        notes: '',
        nro_remito: '',
        delivery_date: ''
    });
    const [editFormData, setEditFormData] = useState({
        id: '',
        product_name: '',
        delivery_date: '',
        image: null
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('active'); // 'active', 'archived', 'all'

    // Fetch orders when search term or filter changes
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchOrders();
        }, 300); // 300ms debounce
        return () => clearTimeout(timer);
    }, [searchTerm, filter]);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchOrders = async () => {
        try {
            const params = {};
            if (searchTerm) params.search = searchTerm;
            if (filter === 'archived') params.show_archived = 'true';
            else if (filter === 'active') params.show_archived = 'false';
            else if (filter === 'all') params.show_archived = 'all';

            const response = await ordersAPI.getAll(params);
            if (response.data.success) {
                let fetchedOrders = response.data.orders;
                if (filter === 'archived') {
                    fetchedOrders.sort((a, b) => {
                        const remitoA = a.nro_remito ? a.nro_remito.toString() : '';
                        const remitoB = b.nro_remito ? b.nro_remito.toString() : '';
                        const numA = parseInt(remitoA.replace(/\D/g, ''), 10) || 0;
                        const numB = parseInt(remitoB.replace(/\D/g, ''), 10) || 0;
                        if (numA !== numB) {
                            return numB - numA;
                        }
                        return remitoB.localeCompare(remitoA);
                    });
                }
                setOrders(fetchedOrders);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    };

    const fetchClients = async () => {
        try {
            const response = await usersAPI.getAll();
            if (response.data.success) {
                setClients(response.data.users);
            }
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    const handleCreateOrder = async (e) => {
        e.preventDefault();

        const isDuplicate = orders.some(
            o => o.product_name.toLowerCase().trim() === formData.product_name.toLowerCase().trim()
        );

        if (isDuplicate) {
            const confirmCreate = window.confirm(`ATENCIÓN: Ya existe un pedido cargado con el nombre "${formData.product_name}". ¿Estás seguro de que deseas crear otro pedido con el mismo nombre?`);
            if (!confirmCreate) {
                return;
            }
        }

        const data = new FormData();
        data.append('client_id', formData.client_id);
        data.append('product_name', formData.product_name);
        if (formData.delivery_date) {
            data.append('delivery_date', formData.delivery_date);
        }
        if (formData.image) {
            data.append('image', formData.image);
        }

        try {
            await ordersAPI.create(data);
            alert('Pedido creado exitosamente');
            fetchOrders();
            setShowCreateModal(false);
            setFormData({ client_id: '', product_name: '', delivery_date: '', image: null });
        } catch (error) {
            alert(error.response?.data?.message || 'Error al crear pedido');
        }
    };

    const handleUpdateStatus = async (e) => {
        e.preventDefault();

        try {
            await ordersAPI.updateStatus(selectedOrder.id, updateData.status, updateData.notes, updateData.nro_remito, updateData.delivery_date);
            alert('Estado actualizado exitosamente');
            fetchOrders();
            setShowUpdateModal(false);
            setUpdateData({ status: '', notes: '', nro_remito: '', delivery_date: '' });
        } catch (error) {
            alert('Error al actualizar estado');
        }
    };

    const handlePriorityChange = async (orderId, priority) => {
        try {
            await ordersAPI.updatePriority(orderId, priority);
            fetchOrders();
        } catch (error) {
            console.error('Error updating priority:', error);
        }
    };

    const handleDeleteOrder = async (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar este pedido? Esta acción no se puede deshacer.')) {
            try {
                await ordersAPI.delete(id);
                alert('Pedido eliminado exitosamente');
                fetchOrders();
            } catch (error) {
                console.error('Error deleting order:', error);
                const msg = error.response?.data?.message || error.message;
                alert('Error al eliminar pedido: ' + msg);
            }
        }
    };

    const handleViewOrder = async (orderId) => {
        try {
            const response = await ordersAPI.getById(orderId);
            if (response.data.success) {
                setSelectedOrder(response.data.order);
            }
        } catch (error) {
            console.error('Error fetching order:', error);
        }
    };

    const openEditModal = (order) => {
        setEditFormData({
            id: order.id,
            product_name: order.product_name,
            delivery_date: order.delivery_date ? new Date(order.delivery_date).toISOString().split('T')[0] : '',
            image: null
        });
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append('product_name', editFormData.product_name);
            if (editFormData.delivery_date) {
                data.append('delivery_date', editFormData.delivery_date);
            } else {
                data.append('delivery_date', ''); // Clear if empty
            }
            if (editFormData.image) {
                data.append('image', editFormData.image);
            }

            await ordersAPI.update(editFormData.id, data);
            alert('Pedido editado exitosamente');
            fetchOrders();
            setShowEditModal(false);
        } catch (error) {
            alert('Error al editar el pedido');
        }
    };

    const openUpdateModal = (order) => {
        setSelectedOrder(order);
        setUpdateData({ status: order.current_status, notes: '', nro_remito: order.nro_remito || '', delivery_date: order.delivery_date ? new Date(order.delivery_date).toISOString().split('T')[0] : '' });
        setShowUpdateModal(true);
    };

    const handleToggleArchive = async (order) => {
        try {
            const newArchiveStatus = !order.is_archived;
            await ordersAPI.toggleArchive(order.id, newArchiveStatus);
            alert(`Pedido ${newArchiveStatus ? 'archivado' : 'desarchivado'} exitosamente`);
            fetchOrders();
        } catch (error) {
            alert('Error al cambiar el estado de archivo');
        }
    };

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        doc.text("Lista de Pedidos", 14, 15);

        // Define which columns to include in the PDF (Priority is EXCLUDED)
        const tableColumn = ["Producto", "Cliente", "Estado", "Nro. Remito", "Fecha Creación", "F. Entrega"];
        const tableRows = [];

        orders.forEach(order => {
            const orderData = [
                order.product_name,
                order.client_name,
                order.current_status,
                order.nro_remito || '-',
                new Date(order.created_at).toLocaleDateString('es-ES'),
                order.delivery_date ? order.delivery_date.split('T')[0].split('-').reverse().join('/') : '-'
            ];
            tableRows.push(orderData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 20
        });

        doc.save(`pedidos_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const statuses = [
        { value: 'ingresado', label: 'Ingresado' },
        { value: 'diseno_realizado', label: 'Diseño' },
        { value: 'preprensa', label: 'Preprensa' },
        { value: 'procesado_fotopolimero', label: 'Fotopolímero' },
        { value: 'montaje', label: 'Montaje' },
        { value: 'correcion', label: 'Control de Calidad' },
        { value: 'listo_entrega', label: 'Remito' },
        { value: 'entregado', label: 'Entregado' }
    ];

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <button onClick={() => navigate('/admin/dashboard')} className="btn btn-secondary">
                        <FiArrowLeft size={18} />
                        Volver
                    </button>
                    <h1>Gestión de Pedidos</h1>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={handleDownloadPDF}
                            className="btn btn-secondary"
                            title="Descargar lista de pedidos en PDF"
                        >
                            <FiDownload size={18} />
                            PDF
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn btn-primary"
                        >
                            <FiPlus size={18} />
                            Nuevo Pedido
                        </button>
                    </div>
                </div>

                <div className={styles.controls} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div className={styles.filterTabs} style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            className={`btn ${filter === 'active' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setFilter('active')}
                        >
                            Activos
                        </button>
                        <button
                            className={`btn ${filter === 'archived' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setFilter('archived')}
                        >
                            Archivados
                        </button>
                        <button
                            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setFilter('all')}
                        >
                            Todos
                        </button>
                    </div>

                    <div className={styles.searchBox} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '250px', background: 'white', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                        <FiSearch size={18} color="var(--text-light)" />
                        <input
                            type="text"
                            placeholder="Buscar por producto o cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ border: 'none', outline: 'none', width: '100%' }}
                        />
                    </div>
                </div>

                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th style={{ width: '80px' }}>Prioridad</th>
                                <th>Producto</th>
                                <th>Cliente</th>
                                <th>Estado</th>
                                <th>Nro. Remito</th>
                                <th>Fecha Creación</th>
                                <th>Fecha de entrega</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order.id}>
                                    <td style={{ textAlign: 'center' }}>
                                        <input
                                            type="number"
                                            min="1"
                                            className="input"
                                            style={{ width: '60px', textAlign: 'center', padding: '4px' }}
                                            value={order.priority_order || ''}
                                            onChange={(e) => handlePriorityChange(order.id, e.target.value)}
                                            placeholder="-"
                                        />
                                    </td>
                                    <td><strong>{order.product_name}</strong></td>
                                    <td>{order.client_name}</td>
                                    <td><StatusBadge status={order.current_status} /></td>
                                    <td>
                                        {order.nro_remito || '-'}
                                    </td>
                                    <td>{new Date(order.created_at).toLocaleDateString('es-ES')}</td>
                                    <td>{order.delivery_date ? order.delivery_date.split('T')[0].split('-').reverse().join('/') : '-'}</td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => openEditModal(order)}
                                                title="Editar Pedido"
                                            >
                                                <FiEdit2 size={14} /> Editar
                                            </button>
                                            <button
                                                onClick={() => handleViewOrder(order.id)}
                                                className="btn btn-secondary"
                                                style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
                                            >
                                                Ver
                                            </button>
                                            <button
                                                onClick={() => openUpdateModal(order)}
                                                className="btn btn-primary"
                                                style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
                                            >
                                                Actualizar
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleArchive(order);
                                                }}
                                                className="btn btn-secondary"
                                                title={order.is_archived ? "Desarchivar" : "Archivar"}
                                                style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}
                                            >
                                                <FiArchive />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteOrder(order.id);
                                                }}
                                                className="btn btn-danger"
                                                title="Eliminar Pedido"
                                                style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem', backgroundColor: '#dc2626', color: 'white' }}
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {orders.length === 0 && (
                        <div className={styles.emptyState}>
                            <p>No hay pedidos registrados</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Order Modal */}
            {showCreateModal && (
                <div className={styles.modal} onClick={() => setShowCreateModal(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <h2>Crear Nuevo Pedido</h2>
                        <form onSubmit={handleCreateOrder} className={styles.form}>
                            <div>
                                <label className="label">Cliente*</label>
                                <select
                                    className="input"
                                    value={formData.client_id}
                                    onChange={e => setFormData({ ...formData, client_id: e.target.value })}
                                    required
                                >
                                    <option value="">Seleccione un cliente</option>
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>
                                            {client.full_name} ({client.username})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="label">Nombre del Producto*</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.product_name}
                                    onChange={e => setFormData({ ...formData, product_name: e.target.value })}
                                    required
                                    placeholder="Ej: Sello personalizado 40x40mm"
                                />
                            </div>

                            <div>
                                <label className="label">Fecha de entrega (estimada)</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={formData.delivery_date}
                                    onChange={e => setFormData({ ...formData, delivery_date: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="label">Imagen del Producto</label>
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={e => setFormData({ ...formData, image: e.target.files[0] })}
                                    className="input"
                                />
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Crear Pedido
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Update Status Modal */}
            {showUpdateModal && selectedOrder && (
                <div className={styles.modal} onClick={() => setShowUpdateModal(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <h2>Actualizar Estado del Pedido</h2>
                        <p className={styles.orderInfo}>
                            <strong>{selectedOrder.product_name}</strong> - #{selectedOrder.id}
                        </p>

                        <form onSubmit={handleUpdateStatus} className={styles.form}>
                            <div>
                                <label className="label">Nuevo Estado*</label>
                                <select
                                    className="input"
                                    value={updateData.status}
                                    onChange={e => setUpdateData({ ...updateData, status: e.target.value })}
                                    required
                                >
                                    {statuses.map(status => (
                                        <option key={status.value} value={status.value}>
                                            {status.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {updateData.status === 'listo_entrega' && (
                                <div>
                                    <label className="label">Nro. de Remito</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={updateData.nro_remito}
                                        onChange={e => setUpdateData({ ...updateData, nro_remito: e.target.value })}
                                        placeholder="Ingrese el número de remito..."
                                    />
                                </div>
                            )}

                            <div>
                                <label className="label">Fecha de entrega (estimada)</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={updateData.delivery_date}
                                    onChange={e => setUpdateData({ ...updateData, delivery_date: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="label">Notas (opcional)</label>
                                <textarea
                                    className="input"
                                    value={updateData.notes}
                                    onChange={e => setUpdateData({ ...updateData, notes: e.target.value })}
                                    rows={3}
                                    placeholder="Agregar información adicional sobre este cambio..."
                                />
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" onClick={() => setShowUpdateModal(false)} className="btn btn-secondary">
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-success">
                                    Actualizar Estado
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Order Modal */}
            {showEditModal && (
                <div className={styles.modal} onClick={() => setShowEditModal(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Editar Pedido</h2>
                            <button onClick={() => setShowEditModal(false)} className={styles.closeBtn}>×</button>
                        </div>
                        <form onSubmit={handleEditSubmit} className={styles.form}>
                            <div>
                                <label className="label">Nombre del Producto*</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={editFormData.product_name}
                                    onChange={e => setEditFormData({ ...editFormData, product_name: e.target.value })}
                                    required
                                    placeholder="Ej: Sello personalizado 40x40mm"
                                />
                            </div>

                            <div>
                                <label className="label">Fecha de entrega (estimada)</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={editFormData.delivery_date}
                                    onChange={e => setEditFormData({ ...editFormData, delivery_date: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="label">Actualizar Imagen del Producto</label>
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={e => setEditFormData({ ...editFormData, image: e.target.files[0] })}
                                    className="input"
                                />
                                <small style={{ color: 'var(--text-light)' }}>Dejar vacío si no desea cambiar la imagen actual.</small>
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Guardar Cambios
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Order Modal */}
            {selectedOrder && !showUpdateModal && (
                <div className={styles.modal} onClick={() => setSelectedOrder(null)}>
                    <div className={styles.modalContent} style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
                        <h2>{selectedOrder.product_name}</h2>
                        <p className={styles.orderInfo}>
                            Cliente: {selectedOrder.client_name} | Pedido #{selectedOrder.id}
                        </p>
                        {selectedOrder.nro_remito && (
                            <p className={styles.orderInfo}>
                                <strong>Nro. Remito:</strong> {selectedOrder.nro_remito}
                            </p>
                        )}
                        {selectedOrder.delivery_date && (
                            <p className={styles.orderInfo}>
                                <strong>Fecha de entrega estimada:</strong> {selectedOrder.delivery_date.split('T')[0].split('-').reverse().join('/')}
                            </p>
                        )}

                        {selectedOrder.image_url && (
                            <div className={styles.orderImage}>
                                <img 
                                    src={selectedOrder.image_url.startsWith('http') ? selectedOrder.image_url : `${STATIC_URL}/${selectedOrder.image_url}`} 
                                    alt={selectedOrder.product_name} 
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://placehold.co/600x400?text=Imagen+No+Disponible';
                                    }}
                                />
                            </div>
                        )}

                        <div style={{ marginTop: 'var(--spacing-xl)' }}>
                            <h3>Historial del Pedido</h3>
                            <OrderTimeline order={selectedOrder} />
                        </div>

                        <div className={styles.modalActions}>
                            <button onClick={() => setSelectedOrder(null)} className="btn btn-secondary">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderManagement;
