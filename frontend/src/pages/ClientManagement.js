import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './ClientManagement.module.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ClientManagement = () => {
    const { token } = useAuth();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [selectedClient, setSelectedClient] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        full_name: '',
        password: ''
    });
    const [passwordData, setPasswordData] = useState({ password: '' });
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const fetchClients = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setClients(data.users);
            }
        } catch (err) {
            setError('Error al cargar clientes.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    const openCreateModal = () => {
        setEditingClient(null);
        setFormData({ username: '', full_name: '', password: '' });
        setShowModal(true);
    };

    const openEditModal = (client) => {
        setEditingClient(client);
        setFormData({
            username: client.username,
            full_name: client.full_name || '',
            password: ''
        });
        setShowModal(true);
    };

    const openPasswordModal = (client) => {
        setSelectedClient(client);
        setPasswordData({ password: '' });
        setShowPasswordModal(true);
    };

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSaveClient = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const url = editingClient
                ? `${API_URL}/api/users/${editingClient.id}`
                : `${API_URL}/api/users`;
            const method = editingClient ? 'PUT' : 'POST';

            const body = {
                username: formData.username,
                full_name: formData.full_name,
            };
            if (!editingClient && formData.password) {
                body.password = formData.password;
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });
            const data = await response.json();
            if (data.success) {
                setShowModal(false);
                fetchClients();
                setSuccessMessage(editingClient ? 'Cliente actualizado.' : `Cliente creado. ${data.temporaryPassword ? `Contraseña temporal: ${data.temporaryPassword}` : ''}`);
                setTimeout(() => setSuccessMessage(''), 6000);
            } else {
                setError(data.message || 'Error al guardar.');
            }
        } catch (err) {
            setError('Error de conexión.');
        } finally {
            setSaving(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const response = await fetch(`${API_URL}/api/users/${selectedClient.id}/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ password: passwordData.password || undefined })
            });
            const data = await response.json();
            if (data.success) {
                setShowPasswordModal(false);
                setSuccessMessage(`Contraseña restablecida. ${data.temporaryPassword ? `Nueva contraseña: ${data.temporaryPassword}` : ''}`);
                setTimeout(() => setSuccessMessage(''), 6000);
            } else {
                setError(data.message || 'Error al restablecer contraseña.');
            }
        } catch (err) {
            setError('Error de conexión.');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (client) => {
        try {
            const response = await fetch(`${API_URL}/api/users/${client.id}/toggle-active`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                fetchClients();
            }
        } catch (err) {
            setError('Error al cambiar estado.');
        }
    };

    if (loading) return <div className={styles.loading}>Cargando clientes...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Gestión de Clientes</h1>
                <button className={styles.btnPrimary} onClick={openCreateModal}>
                    + Nuevo Cliente
                </button>
            </div>

            {error && <div className={styles.error}>{error}</div>}
            {successMessage && <div className={styles.success}>{successMessage}</div>}

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>Nombre Completo</th>
                            <th>Estado</th>
                            <th>Registro</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clients.length === 0 ? (
                            <tr>
                                <td colSpan="5" className={styles.emptyState}>
                                    No hay clientes registrados
                                </td>
                            </tr>
                        ) : (
                            clients.map(client => (
                                <tr key={client.id}>
                                    <td>{client.username}</td>
                                    <td>{client.full_name || '-'}</td>
                                    <td>
                                        <span className={client.is_active ? styles.badgeActive : styles.badgeInactive}>
                                            {client.is_active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td>{new Date(client.created_at).toLocaleDateString('es-AR')}</td>
                                    <td className={styles.actions}>
                                        <button className={styles.btnEdit} onClick={() => openEditModal(client)}>Editar</button>
                                        <button className={styles.btnPassword} onClick={() => openPasswordModal(client)}>Contraseña</button>
                                        <button
                                            className={client.is_active ? styles.btnDeactivate : styles.btnActivate}
                                            onClick={() => handleToggleActive(client)}
                                        >
                                            {client.is_active ? 'Desactivar' : 'Activar'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal crear/editar cliente */}
            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
                        <form onSubmit={handleSaveClient}>
                            <div className={styles.formGroup}>
                                <label>Usuario *</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleFormChange}
                                    required
                                    placeholder="Nombre de usuario"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Nombre Completo *</label>
                                <input
                                    type="text"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleFormChange}
                                    required
                                    placeholder="Nombre y apellido"
                                />
                            </div>
                            {!editingClient && (
                                <div className={styles.formGroup}>
                                    <label>Contraseña (opcional)</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleFormChange}
                                        placeholder="Dejar vacío para generar automáticamente"
                                    />
                                </div>
                            )}
                            <div className={styles.modalActions}>
                                <button type="button" className={styles.btnSecondary} onClick={() => setShowModal(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className={styles.btnPrimary} disabled={saving}>
                                    {saving ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal cambiar contraseña */}
            {showPasswordModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h2>Cambiar Contraseña</h2>
                        <p>Ingrese una nueva contraseña para el cliente, o deje en blanco para generar una aleatoria segura.</p>
                        <form onSubmit={handleResetPassword}>
                            <div className={styles.formGroup}>
                                <label>Nueva Contraseña</label>
                                <input
                                    type="password"
                                    value={passwordData.password}
                                    onChange={(e) => setPasswordData({ password: e.target.value })}
                                    placeholder="Dejar vacío para generar automáticamente"
                                />
                            </div>
                            <div className={styles.modalActions}>
                                <button type="button" className={styles.btnSecondary} onClick={() => setShowPasswordModal(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className={styles.btnPrimary} disabled={saving}>
                                    {saving ? 'Guardando...' : 'Restablecer'}
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
