import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ordersAPI, STATIC_URL } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { FiLogOut, FiSearch, FiPackage, FiGrid, FiList } from 'react-icons/fi';
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
    const [viewMode, setViewMode] = useState('grid'); // grid or table

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
                                Entregados ({orders.filter(o => o.is_archived).length})
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

                        <div className={styles.viewToggle}>
                            <button
                                className={`${styles.toggleBtn} ${viewMode === 'grid' ? styles.activeToggle : ''}`}
                                onClick={() => setViewMode('grid')}
                                title="Vista de tarjetas"
                            >
                                <FiGrid size={18} />
                            </button>
                            <button
                                className={`${styles.toggleBtn} ${viewMode === 'table' ? styles.activeToggle : ''}`}
                                onClick={() => setViewMode('table')}
                                title="Vista de lista / tabla"
                            >
                                <FiList size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Orders Content */}
                    {filteredOrders.length === 0 ? (
                        <div className={styles.emptyState}>
                            <FiPackage size={64} color="var(--gray-300)" />
                            <h3>No hay pedidos</h3>
                            <p>Aún no tienes pedidos registrados en el sistema.</p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className={styles.ordersGrid}>
                            {filteredOrders.map(order => (
                                <div
                                    key={order.id}
                                    className={styles.orderCard}
                                    onClick={() => handleViewOrder(order.id)}
                                >
                                    {order.image_url && (
                                        <div className={styles.orderImage}>
                                            <img 
                                                src={order.image_url.startsWith('http') ? order.image_url : `${STATIC_URL}/${order.image_url}`} 
                                                alt={order.product_name} 
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://placehold.co/600x400?text=Imagen+No+Disponible';
                                                }}
                                            />
                                        </div>
                                    )}
                                    <div className={styles.orderInfo}>
                                        <div className={styles.orderHeader}>
                                            <h3>{order.product_name}</h3>
                                        </div>
                                        {order.nro_remito && (
                                            <p className={styles.nroRemito}><strong>Nro. Remito:</strong> {order.nro_remito}</p>
                                        )}
                                        {order.delivery_date && (
                                            <p className={styles.nroRemito}><strong>Fecha de entrega:</strong> {order.delivery_date.split('T')[0].split('-').reverse().join('/')}</p>
                                        )}
                                        <StatusBadge status={order.current_status} />
                                        <p className={styles.orderDate}>
                                            Creado {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: es })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Pedido #</th>
                                        <th>Producto</th>
                                        <th>Nro. Remito</th>
                                        <th>Fecha de Entrega</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.map(order => (
                                        <tr key={order.id} onClick={() => handleViewOrder(order.id)} style={{ cursor: 'pointer' }}>
                                            <td className={styles.orderIdCell}>#{order.id}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    {order.image_url && (
                                                        <img 
                                                            src={order.image_url.startsWith('http') ? order.image_url : `${STATIC_URL}/${order.image_url}`} 
                                                            alt={order.product_name} 
                                                            className={styles.thumbnail}
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = 'https://placehold.co/600x400?text=Sello';
                                                            }}
                                                        />
                                                    )}
                                                    <strong>{order.product_name}</strong>
                                                </div>
                                            </td>
                                            <td>{order.nro_remito || '-'}</td>
                                            <td>
                                                {order.delivery_date 
                                                    ? order.delivery_date.split('T')[0].split('-').reverse().join('/') 
                                                    : '-'
                                                }
                                            </td>
                                            <td>
                                                <StatusBadge status={order.current_status} />
                                            </td>
                                            <td onClick={(e) => e.stopPropagation()}>
                                                <button 
                                                    onClick={() => handleViewOrder(order.id)} 
                                                    className="btn btn-secondary btn-sm"
                                                >
                                                    Ver detalles
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className={styles.closeBtn}>×</button>
                        </div>

                        <div className={styles.modalBody}>
                            {selectedOrder.image_url && (
                                <div className={styles.modalImage}>
                                    <img 
                                        src={selectedOrder.image_url.startsWith('http') ? selectedOrder.image_url : `${STATIC_URL}/${selectedOrder.image_url}`} 
                                        alt={selectedOrder.product_name} 
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://placehold.co/600x400?text=Imagen+No+Disponible';
                                        }}
                                    />
                                    <div className={styles.imageActions}>
                                        <a
                                            href={selectedOrder.image_url.startsWith('http') ? selectedOrder.image_url : `${STATIC_URL}/${selectedOrder.image_url}`}
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
                                    {selectedOrder.delivery_date && (
                                        <p style={{ marginTop: 'var(--spacing-sm)' }}>
                                            <strong>Fecha de entrega:</strong> {selectedOrder.delivery_date.split('T')[0].split('-').reverse().join('/')}
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
