import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ordersAPI, usersAPI } from '../services/api';
import { FiLogOut, FiUsers, FiPackage, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import StatusBadge from '../components/StatusBadge';
import NotificationBell from '../components/NotificationBell';
import styles from './AdminDashboard.module.css';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // Change password modal
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [pwLoading, setPwLoading] = useState(false);
    const [pwError, setPwError] = useState('');
    const [pwSuccess, setPwSuccess] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await ordersAPI.getStats();
            if (response.data.success) {
                setStats(response.data.stats);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusCount = (status) => {
        const found = stats?.byStatus.find(item => item.current_status === status);
        return parseInt(found?.count || 0);
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPwError('');
        setPwSuccess('');

        if (pwForm.newPassword !== pwForm.confirmPassword) {
            setPwError('Las contraseñas nuevas no coinciden.');
            return;
        }
        if (pwForm.newPassword.length < 6) {
            setPwError('La nueva contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setPwLoading(true);
        try {
            const res = await usersAPI.changeOwnPassword(pwForm.currentPassword, pwForm.newPassword);
            if (res.data.success) {
                setPwSuccess('¡Contraseña cambiada exitosamente!');
                setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setTimeout(() => setShowPasswordModal(false), 2000);
            }
        } catch (err) {
            setPwError(err.response?.data?.message || 'Error al cambiar contraseña.');
        } finally {
            setPwLoading(false);
        }
    };

    const statusCards = [
        { status: 'diseno_realizado', label: 'Diseño', color: 'info' },
        { status: 'preprensa', label: 'Preprensa', color: 'primary' },
        { status: 'procesado_fotopolimero', label: 'Fotopolímero', color: 'purple' },
        { status: 'montaje', label: 'Montaje/Control', color: 'warning' },
        { status: 'listo_entrega', label: 'Remito', color: 'teal' },
        { status: 'entregado', label: 'Entregado', color: 'success' },
    ];

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
                            <h1>Panel de Administración</h1>
                            <p className={styles.subtitle}>Bienvenido, {user?.full_name}</p>
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

            {/* Change Password Modal */}
            {showPasswordModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white', borderRadius: '12px', padding: '2rem',
                        width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
                    }}>
                        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '600' }}>
                            <FiLock style={{ marginRight: '0.5rem' }} />
                            Cambiar Contraseña
                        </h2>

                        {pwError && (
                            <div style={{ background: '#fee2e2', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>
                                {pwError}
                            </div>
                        )}
                        {pwSuccess && (
                            <div style={{ background: '#dcfce7', color: '#16a34a', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem' }}>
                                {pwSuccess}
                            </div>
                        )}

                        <form onSubmit={handlePasswordChange}>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label className="label">Contraseña Actual</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showCurrent ? 'text' : 'password'}
                                        className="input"
                                        value={pwForm.currentPassword}
                                        onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                                        placeholder="Contraseña actual"
                                        required
                                    />
                                    <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                                        {showCurrent ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label className="label">Nueva Contraseña</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showNew ? 'text' : 'password'}
                                        className="input"
                                        value={pwForm.newPassword}
                                        onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                                        placeholder="Mínimo 6 caracteres"
                                        required
                                    />
                                    <button type="button" onClick={() => setShowNew(!showNew)}
                                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                                        {showNew ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="label">Confirmar Nueva Contraseña</label>
                                <input
                                    type="password"
                                    className="input"
                                    value={pwForm.confirmPassword}
                                    onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                                    placeholder="Repita la nueva contraseña"
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button type="submit" className="btn btn-primary" disabled={pwLoading} style={{ flex: 1 }}>
                                    {pwLoading ? 'Guardando...' : 'Guardar Contraseña'}
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordModal(false)} style={{ flex: 1 }}>
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className={styles.container}>
                {/* Navigation Cards */}
                <div className={styles.navCards}>
                    <button
                        className={styles.navCard}
                        onClick={() => navigate('/admin/clients')}
                    >
                        <div className={`${styles.navIcon} ${styles.iconBlue}`}>
                            <FiUsers size={24} />
                        </div>
                        <div>
                            <h3>Gestión de Clientes</h3>
                            <p>{stats?.totalClients || 0} clientes activos</p>
                        </div>
                    </button>

                    <button
                        className={styles.navCard}
                        onClick={() => navigate('/admin/orders')}
                    >
                        <div className={`${styles.navIcon} ${styles.iconPurple}`}>
                            <FiPackage size={24} />
                        </div>
                        <div>
                            <h3>Gestión de Pedidos</h3>
                            <p>{stats?.totalActive || 0} pedidos activos</p>
                        </div>
                    </button>
                </div>

                {/* Statistics Grid */}
                <div className={styles.section} id="stats-section">
                    <h2>Pedidos por Estado</h2>
                    <div className={styles.statsGrid}>
                        {statusCards.map(card => (
                            <div key={card.status} className={`${styles.statCard} ${styles[card.color]}`}>
                                <div className={styles.statLabel}>{card.label}</div>
                                <div className={styles.statValue}>{getStatusCount(card.status)}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Orders */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>Pedidos Recientes</h2>
                        <button
                            onClick={() => navigate('/admin/orders')}
                            className="btn btn-primary"
                        >
                            Ver Todos los Pedidos
                        </button>
                    </div>

                    <div className={styles.ordersTable}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Cliente</th>
                                    <th>Estado</th>
                                    <th>Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats?.recentOrders.map(order => (
                                    <tr key={order.id}>
                                        <td>{order.product_name}</td>
                                        <td>{order.client_name}</td>
                                        <td>
                                            <StatusBadge status={order.current_status} />
                                        </td>
                                        <td>{new Date(order.created_at).toLocaleDateString('es-ES')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
                            <div className={styles.emptyTable}>
                                <p>No hay pedidos recientes</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
