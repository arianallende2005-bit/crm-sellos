import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersAPI } from '../services/api';
import { FiArrowLeft, FiUserPlus, FiEdit2, FiKey, FiToggleLeft, FiToggleRight, FiTrash2 } from 'react-icons/fi';
import styles from './ClientManagement.module.css';

const ClientManagement = () => {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        full_name: ''
    });
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordClientId, setPasswordClientId] = useState(null);
    const [newPasswordInput, setNewPasswordInput] = useState('');

    useEffect(() => {
        fetchClients();
    }, []);

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
            email: client.email,
            full_name: client.full_name,
            password: ''
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingClient(null);
        setGeneratedPassword('');
        setFormData({ username: '', password: '', email: '', full_name: '' });
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
                                <th>ID</th>
                                <th>Usuario</th>
                                <th>Nombre Completo</th>
                                <th>Email</th>
                                <th>Estado</th>
                                <th>Fecha Creación</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.map(client => (
                                <tr key={client.id}>
                                    <td>#{client.id}</td>
                                    <td><strong>{client.username}</strong></td>
                                    <td>{client.full_name}</td>
                                    <td>{client.email}</td>
                                    <td>
                                        <span className={`${styles.badge} ${client.is_active ? styles.active : styles.inactive}`}>
                                            {client.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td>{new Date(client.created_at).toLocaleDateString('es-ES')}</td>
                                    <td>
                                        <div className={styles.actions}>
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

                            <div>
                                <label className="label">Email*</label>
                                <input
                                    type="email"
                                    className="input"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
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
        </div>
    );
};

export default ClientManagement;
