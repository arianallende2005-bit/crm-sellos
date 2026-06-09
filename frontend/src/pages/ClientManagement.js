import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersAPI, ordersAPI } from '../services/api';
import { FiArrowLeft, FiUserPlus, FiEdit2, FiKey, FiToggleLeft, FiToggleRight, FiTrash2, FiList, FiDownload } from 'react-icons/fi';
import StatusBadge from '../components/StatusBadge';
import styles from './ClientManagement.module.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ClientManagement = () => {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        full_name: ''
    });
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordClientId, setPasswordClientId] = useState(null);
    const [newPasswordInput, setNewPasswordInput] = useState('');
    const [selectedClientForJobs, setSelectedClientForJobs] = useState(null);
    const [clientOrders, setClientOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState('');

    useEffect(() => {
        fetchClients();
    }, []);

    useEffect(() => {
        if (!selectedMonth) {
            setFilteredOrders(clientOrders);
        } else {
            const [year, month] = selectedMonth.split('-');
            const filtered = clientOrders.filter(order => {
                const date = new Date(order.created_at);
                const orderYear = date.getFullYear().toString();
                const orderMonth = (date.getMonth() + 1).toString().padStart(2, '0');
                return orderYear === year && orderMonth === month;
            });
            setFilteredOrders(filtered);
        }
    }, [selectedMonth, clientOrders]);

    const handleViewJobs = async (client) => {
        setSelectedClientForJobs(client);
        setSelectedMonth(''); 
        try {
            const response = await ordersAPI.getAll({ client_id: client.id, show_archived: 'all' });
            if (response.data.success) {
                setClientOrders(response.data.orders);
                setFilteredOrders(response.data.orders);
            }
        } catch (error) {
            console.error('Error fetching client jobs:', error);
            alert('Error al obtener los trabajos del cliente.');
        }
    };

    const handleDownloadJobsPDF = () => {
        if (filteredOrders.length === 0) {
            alert('No hay trabajos para exportar en este mes.');
            return;
        }

        const doc = new jsPDF();
        
        let monthTitle = "Todos los meses";
        if (selectedMonth) {
            const [year, month] = selectedMonth.split('-');
            const monthNames = [
                "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
                "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
            ];
            monthTitle = `${monthNames[parseInt(month) - 1]} de ${year}`;
        }

        doc.setFontSize(16);
        doc.text(`Reporte de Trabajos - ${selectedClientForJobs.full_name}`, 14, 15);
        doc.setFontSize(12);
        doc.text(`Período: ${monthTitle}`, 14, 22);

        const tableColumn = ["Pedido #", "Producto", "Estado", "Nro. Remito", "Fecha Creación", "Fecha Entrega"];
        const tableRows = [];

        const statusTranslations = {
            'diseno_realizado': 'Diseño',
            'preprensa': 'Preprensa',
            'procesado_fotopolimero': 'Fotopolímero',
            'montaje': 'Montaje',
            'listo_entrega': 'Remito',
            'entregado': 'Entregado'
        };

        filteredOrders.forEach(order => {
            const orderData = [
                `#${order.id}`,
                order.product_name,
                statusTranslations[order.current_status] || order.current_status,
                order.nro_remito || '-',
                order.created_at ? order.created_at.split('T')[0].split('-').reverse().join('/') : '-',
                order.delivery_date ? order.delivery_date.split('T')[0].split('-').reverse().join('/') : '-'
            ];
            tableRows.push(orderData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 28,
            theme: 'striped',
            headStyles: { fillColor: [79, 70, 229] } // Indigo header
        });

        const fileName = `trabajos_${selectedClientForJobs.username}_${selectedMonth || 'todos'}.pdf`;
        doc.save(fileName);
    };

    const fetchClients = async () => {
        try {
            const response = await usersAPI.getAll();
            if (response.data.success) {
                setClients(response.data.users);
            }
        } catch (error) {
            console.error('Error fetching clients:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingClient) {
                await usersAPI.update(editingClient.id, formData);
                alert('Cliente actualizado exitosamente');
            } else {
                const response = await usersAPI.create(formData);
                if (response.data.temporaryPassword) {
                    setGeneratedPassword(response.data.temporaryPassword);
                }
                alert('Cliente creado exitosamente');
            }

            fetchClients();
            closeModal();
        } catch (error) {
            alert(error.response?.data?.message || 'Error al guardar cliente');
        }
    };

    const openPasswordModal = (clientId) => {
        setPasswordClientId(clientId);
        setNewPasswordInput('');
        setShowPasswordModal(true);
    };

    const submitNewPassword = async (e) => {
        e.preventDefault();
        try {
            const response = await usersAPI.resetPassword(passwordClientId, newPasswordInput || undefined);
            
            if (response.data.temporaryPassword) {
                alert(`Nueva contraseña generada: ${response.data.temporaryPassword}\n\nPor favor, guárdela y entréguese al cliente.`);
            } else {
                alert('Contraseña actualizada exitosamente.');
            }
            setShowPasswordModal(false);
        } catch (error) {
            alert(error.response?.data?.message || 'Error al restablecer contraseña');
        }
    };

    const handleToggleActive = async (clientId) => {
        try {
            await usersAPI.toggleActive(clientId);
            fetchClients();
        } catch (error) {
            alert('Error al cambiar estado del cliente');
        }
    };

    const handleDeleteClient = async (clientId) => {
        if (!window.confirm('¿Está seguro de eliminar este cliente? Se eliminarán también todos sus pedidos y notificaciones. Esta acción NO se puede deshacer.')) return;
        
        try {
            const response = await usersAPI.delete(clientId);
            if (response.data.success) {
                alert('Cliente eliminado exitosamente.');
                fetchClients();
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Error al eliminar cliente');
        }
    };

    const openEditModal = (client) => {
        setEditingClient(client);
        setFormData({
            username: client.username,
            full_name: client.full_name,
            password: ''
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingClient(null);
        setGeneratedPassword('');
        setFormData({ username: '', password: '', full_name: '' });
    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <button onClick={() => navigate('/admin/dashboard')} className="btn btn-secondary">
                        <FiArrowLeft size={18} />
                        Volver
                    </button>
                    <h1>Gestión de Clientes</h1>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn btn-primary"
                    >
                        <FiUserPlus size={18} />
                        Nuevo Cliente
                    </button>
                </div>

                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Usuario</th>
                                <th>Nombre Completo</th>
                                <th>Estado</th>
                                <th>Fecha Creación</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.map(client => (
                                <tr key={client.id}>
                                    <td><strong>{client.username}</strong></td>
                                    <td>{client.full_name}</td>
                                    <td>
                                        <span className={`${styles.badge} ${client.is_active ? styles.active : styles.inactive}`}>
                                            {client.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td>{client.created_at ? client.created_at.split('T')[0].split('-').reverse().join('/') : '-'}</td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button
                                                onClick={() => handleViewJobs(client)}
                                                className={styles.actionBtn}
                                                title="Ver trabajos del cliente"
                                                style={{ color: 'var(--primary)' }}
                                            >
                                                <FiList size={16} />
                                            </button>
                                            <button
                                                onClick={() => openEditModal(client)}
                                                className={styles.actionBtn}
                                                title="Editar"
                                            >
                                                <FiEdit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => openPasswordModal(client.id)}
                                                className={styles.actionBtn}
                                                title="Cambiar contraseña"
                                            >
                                                <FiKey size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleToggleActive(client.id)}
                                                className={styles.actionBtn}
                                                title={client.is_active ? 'Desactivar' : 'Activar'}
                                            >
                                                {client.is_active ? <FiToggleRight size={16} /> : <FiToggleLeft size={16} />}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClient(client.id)}
                                                className={styles.actionBtn}
                                                title="Eliminar cliente"
                                                style={{ color: '#dc2626' }}
                                            >
                                                <FiTrash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {clients.length === 0 && !loading && (
                        <div className={styles.emptyState}>
                            <p>No hay clientes registrados</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className={styles.modal} onClick={closeModal}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <h2>{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>

                        {generatedPassword && (
                            <div className={styles.passwordAlert}>
                                <strong>Contraseña generada:</strong> {generatedPassword}
                                <br />
                                <small>Guarde esta contraseña y entréguese al cliente</small>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div>
                                <label className="label">Usuario*</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    required
                                    disabled={editingClient}
                                />
                            </div>

                            <div>
                                <label className="label">Nombre Completo*</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.full_name}
                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                    required
                                />
                            </div>

                            {!editingClient && (
                                <div>
                                    <label className="label">Contraseña (opcional)</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="Dejar vacío para generar automáticamente"
                                    />
                                </div>
                            )}

                            <div className={styles.modalActions}>
                                <button type="button" onClick={closeModal} className="btn btn-secondary">
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingClient ? 'Actualizar' : 'Crear Cliente'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Password Modal */}
            {showPasswordModal && (
                <div className={styles.modal} onClick={() => setShowPasswordModal(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <h2>Cambiar Contraseña</h2>
                        <p style={{ marginBottom: '1rem', color: '#666' }}>
                            Ingrese una nueva contraseña para el cliente, o deje en blanco para generar una aleatoria segura.
                        </p>
                        <form onSubmit={submitNewPassword} className={styles.form}>
                            <div>
                                <label className="label">Nueva Contraseña (opcional)</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={newPasswordInput}
                                    onChange={e => setNewPasswordInput(e.target.value)}
                                    placeholder="Dejar vacío para aleatoria"
                                />
                            </div>
                            <div className={styles.modalActions}>
                                <button type="button" onClick={() => setShowPasswordModal(false)} className="btn btn-secondary">
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Actualizar Contraseña
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Client Jobs Modal */}
            {selectedClientForJobs && (
                <div className={styles.modal} onClick={() => setSelectedClientForJobs(null)}>
                    <div className={styles.modalContent} style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h2>Trabajos de {selectedClientForJobs.full_name}</h2>
                                <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', margin: 0 }}>
                                    Usuario: @{selectedClientForJobs.username}
                                </p>
                            </div>
                            <button onClick={() => setSelectedClientForJobs(null)} className={styles.closeBtn}>×</button>
                        </div>

                        {/* Month Filter and Export Buttons */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <label className="label" style={{ margin: 0 }}>Filtrar por Mes:</label>
                                <input
                                    type="month"
                                    className="input"
                                    style={{ padding: '6px 12px', width: '180px' }}
                                    value={selectedMonth}
                                    onChange={e => setSelectedMonth(e.target.value)}
                                />
                                {selectedMonth && (
                                    <button 
                                        onClick={() => setSelectedMonth('')} 
                                        className="btn btn-secondary btn-sm"
                                        style={{ padding: '6px 12px' }}
                                    >
                                        Limpiar
                                    </button>
                                )}
                            </div>

                            <button
                                onClick={handleDownloadJobsPDF}
                                className="btn btn-primary"
                                disabled={filteredOrders.length === 0}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <FiDownload size={16} />
                                Descargar PDF
                            </button>
                        </div>

                        {/* Jobs Table */}
                        <div className={styles.tableContainer} style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Pedido #</th>
                                        <th>Producto</th>
                                        <th>Estado</th>
                                        <th>Nro. Remito</th>
                                        <th>Fecha Creación</th>
                                        <th>Fecha Entrega</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.map(order => (
                                        <tr key={order.id}>
                                            <td><strong>#{order.id}</strong></td>
                                            <td>{order.product_name}</td>
                                            <td>
                                                <StatusBadge status={order.current_status} />
                                            </td>
                                            <td>{order.nro_remito || '-'}</td>
                                            <td>{order.created_at ? order.created_at.split('T')[0].split('-').reverse().join('/') : '-'}</td>
                                            <td>{order.delivery_date ? order.delivery_date.split('T')[0].split('-').reverse().join('/') : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {filteredOrders.length === 0 && (
                                <div className={styles.emptyState} style={{ padding: '2rem' }}>
                                    <p>No hay trabajos registrados en este período.</p>
                                </div>
                            )}
                        </div>

                        <div className={styles.modalActions} style={{ marginTop: '1.5rem' }}>
                            <button onClick={() => setSelectedClientForJobs(null)} className="btn btn-secondary">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientManagement;
