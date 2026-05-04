import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ordersAPI, STATIC_URL } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { FiLogOut, FiSearch, FiPackage } from 'react-icons/fi';
import StatusBadge from '../components/StatusBadge';
import OrderTimeline from '../components/OrderTimeline';
import NotificationBell from '../components/NotificationBell';
import styles from './ClientDashboard.module.css';

const ClientDashboard = () => {
    const { user, logout } = useAuth();
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, active, archived
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchOrders();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [filter, searchTerm, orders]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await ordersAPI.getAll({ show_archived: 'all' });
            if (response.data.success) {
                setOrders(response.data.orders);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = [...orders];

        // Filter by archived status
        if (filter === 'active') {
            result = result.filter(order => !order.is_archived);
        } else if (filter === 'archived') {
            result = result.filter(order => order.is_archived);
        }

        // Search filter
        if (searchTerm) {
            result = result.filter(order =>
                order.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.id.toString().includes(searchTerm)
            );
        }

        setFilteredOrders(result);
    };

    const handleViewOrder = async (orderId) => {
        try {
            const response = await ordersAPI.getById(orderId);
            if (response.data.success) {
                setSelectedOrder(response.data.order);
            }
        } catch (error) {
            console.error('Error fetching order details:', error);
        }
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className="spinner" style={{ width: '3rem', height: '3rem' }}></div>
            </div>
        );
    }

    return (
        <div className={styles.dashboard}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <img src="/logo.png" alt="Logo" className={styles.logo} style={{ height: '40px', objectFit: 'contain' }} />
                        <div>
                            <h1>Central Grafica</h1>
                            <p className={styles.subtitle}>Pedidos Realizados</p>
                        </div>
                    </div>
                    <div className={styles.headerActions}>
                        <NotificationBell />
                        <button onClick={logout} className="btn btn-secondary">
                            <FiLogOut size={18} />
                            Salir
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className={styles.container}>
                <div className={styles.content}>
                    {/* Filters and Search */}
                    <div className={styles.controls}>
                        <div className={styles.filterTabs}>
                            <button
                                className={`${styles.filterTab} ${filter === 'all' ? styles.active : ''}`}
                                onClick={() => setFilter('all')}
                            >
                                Todos ({orders.length})
                            </button>
                            <button
                                className={`${styles.filterTab} ${filter === 'active' ? styles.active : ''}`}
                                onClick={() => setFilter('active')}
                            >
                                Activos ({orders.filter(o => !o.is_archived).length})
                            </button>
                            <button
                                className={`${styles.filterTab} ${filter === 'archived' ? styles.active : ''}`}
                                onClick={() => setFilter('archived')}
                            >
                                Archivados ({orders.filter(o => o.is_archived).length})
                            </button>
                        </div>

                        <div className={styles.searchBox}>
                            <FiSearch size={18} color="var(--gray-400)" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o número de pedido..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={styles.searchInput}
                            />
                        </div>
                    </div>

                    {/* Orders Grid */}
                    {filteredOrders.length === 0 ? (
                        <div className={styles.emptyState}>
                            <FiPackage size={64} color="var(--gray-300)" />
                            <h3>No hay pedidos</h3>
                            <p>Aún no tienes pedidos registrados en el sistema.</p>
                        </div>
                    ) : (
                        <div className={styles.ordersGrid}>
                            {filteredOrders.map(order => (
                                <div
                                    key={order.id}
                                    className={styles.orderCard}
                                    onClick={() => handleViewOrder(order.id)}
                                >
                                    {order.image_url && (
                                        <div className={styles.orderImage}>
                                            <img src={`${STATIC_URL}/${order.image_url}`} alt={order.product_name} />
                                        </div>
                                    )}
                                    <div className={styles.orderInfo}>
                                        <div className={styles.orderHeader}>
                                            <h3>{order.product_name}</h3>
                                            <span className={styles.orderId}>#{order.id}</span>
                                        </div>
                                        {order.nro_remito && (
                                            <p className={styles.nroRemito}><strong>Nro. Remito:</strong> {order.nro_remito}</p>
                                        )}
                                        <StatusBadge status={order.current_status} />
                                        <p className={styles.orderDate}>
                                            Creado {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: es })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className={styles.modal} onClick={() => setSelectedOrder(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div>
                                <h2>{selectedOrder.product_name}</h2>
                                <p className={styles.modalSubtitle}>Pedido #{selectedOrder.id}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className={styles.closeBtn}>×</button>
                        </div>

                        <div className={styles.modalBody}>
                            {selectedOrder.image_url && (
                                <div className={styles.modalImage}>
                                    <img src={`${STATIC_URL}/${selectedOrder.image_url}`} alt={selectedOrder.product_name} />
                                    <div className={styles.imageActions}>
                                        <a
                                            href={`${STATIC_URL}/${selectedOrder.image_url}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.fullImageLink}
                                        >
                                            Ver imagen completa
                                        </a>
                                    </div>
                                </div>
                            )}

                            <div className={styles.section}>
                                <h3>Estado Actual</h3>
                                <div style={{ marginTop: 'var(--spacing-md)' }}>
                                    <StatusBadge status={selectedOrder.current_status} />
                                    {selectedOrder.nro_remito && (
                                        <p style={{ marginTop: 'var(--spacing-sm)' }}>
                                            <strong>Nro. Remito:</strong> {selectedOrder.nro_remito}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className={styles.section}>
                                <h3>Historial del Pedido</h3>
                                <OrderTimeline order={selectedOrder} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientDashboard;
