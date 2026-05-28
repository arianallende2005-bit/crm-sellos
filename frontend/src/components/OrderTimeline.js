import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import styles from './OrderTimeline.module.css';
import { FiPackage, FiEdit, FiTool, FiCheckCircle, FiSend, FiCheck, FiFileText, FiLayers, FiShield } from 'react-icons/fi';
import { ordersAPI } from '../services/api';

const OrderTimeline = ({ order, isAdmin, onUpdate }) => {
    const [editingStageKey, setEditingStageKey] = useState(null);
    const [editNotes, setEditNotes] = useState('');
    const [saving, setSaving] = useState(false);

    const stages = [
        { key: 'diseno_realizado', label: 'Diseño', icon: FiEdit },
        { key: 'preprensa', label: 'Preprensa', icon: FiLayers },
        { key: 'procesado_fotopolimero', label: 'Fotopolímero', icon: FiTool },
        { key: 'montaje', label: 'Montaje', icon: FiPackage },
        { key: 'listo_entrega', label: 'Remito', icon: FiCheckCircle },
        { key: 'entregado', label: 'Entregado', icon: FiSend },
    ];

    const handleSave = async (stageKey) => {
        if (!editNotes.trim() && !window.confirm('¿Desea guardar la nota vacía? Esto eliminará la nota actual.')) {
            return;
        }
        
        setSaving(true);
        try {
            await ordersAPI.updateHistoryNotes(order.id, stageKey, editNotes);
            if (onUpdate) {
                onUpdate();
            }
            setEditingStageKey(null);
        } catch (error) {
            console.error('Error saving history notes:', error);
            alert('Error al guardar la nota. Intente nuevamente.');
        } finally {
            setSaving(false);
        }
    };

    // Create a map of status to history entry
    const historyMap = {};
    if (order.history) {
        order.history.forEach(entry => {
            historyMap[entry.status] = entry;
        });
    }

    // Find current stage index
    const currentIndex = stages.findIndex(s => s.key === order.current_status);

    return (
        <div className={styles.timeline}>
            {stages.map((stage, index) => {
                const historyEntry = historyMap[stage.key];
                const isCompleted = index <= currentIndex;
                const isCurrent = index === currentIndex;
                const Icon = stage.icon;

                return (
                    <div key={stage.key} className={styles.timelineItem}>
                        <div className={styles.timelineMarker}>
                            <div
                                className={`${styles.iconCircle} ${isCompleted ? styles.completed : styles.pending
                                    } ${isCurrent ? styles.current : ''}`}
                            >
                                {isCompleted ? <FiCheck size={16} /> : <Icon size={16} />}
                            </div>
                            {index < stages.length - 1 && (
                                <div
                                    className={`${styles.connector} ${isCompleted ? styles.connectorCompleted : ''
                                        }`}
                                />
                            )}
                        </div>

                        <div className={styles.timelineContent}>
                            <h4 className={isCompleted ? styles.completedText : styles.pendingText}>
                                {stage.label}
                            </h4>
                            {isCompleted && (
                                <div className={styles.timelineDetails}>
                                    {historyEntry ? (
                                        <>
                                            <p className={styles.timestamp}>
                                                {format(new Date(historyEntry.changed_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                                            </p>
                                            {historyEntry.changed_by_name && (
                                                <p className={styles.changedBy}>
                                                    por {historyEntry.changed_by_name}
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <p className={styles.timestamp} style={{ fontStyle: 'italic', color: 'var(--gray-400)' }}>
                                            Completado (historial anterior)
                                        </p>
                                    )}
                                    
                                    {editingStageKey === stage.key ? (
                                        <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            <textarea
                                                value={editNotes}
                                                onChange={(e) => setEditNotes(e.target.value)}
                                                className="input"
                                                rows={2}
                                                style={{ fontSize: '0.875rem', padding: '0.375rem', width: '100%', resize: 'vertical' }}
                                                placeholder="Escriba una nota para este estado..."
                                                disabled={saving}
                                            />
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={() => setEditingStageKey(null)}
                                                    className="btn btn-secondary btn-sm"
                                                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                                                    disabled={saving}
                                                    type="button"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    onClick={() => handleSave(stage.key)}
                                                    className="btn btn-success btn-sm"
                                                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                                                    disabled={saving}
                                                    type="button"
                                                >
                                                    {saving ? 'Guardando...' : 'Guardar'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                                            <p className={styles.notes} style={{ margin: 0, flex: 1 }}>
                                                {historyEntry?.notes || <em style={{ color: 'var(--gray-400)' }}>Sin notas</em>}
                                            </p>
                                            {isAdmin && (
                                                <button
                                                    onClick={() => {
                                                        setEditingStageKey(stage.key);
                                                        setEditNotes(historyEntry?.notes || '');
                                                    }}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        color: 'var(--primary)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        padding: '0.25rem',
                                                        borderRadius: '4px',
                                                        transition: 'background 0.2s'
                                                    }}
                                                    title="Editar nota de estado"
                                                    type="button"
                                                    onMouseOver={(e) => e.currentTarget.style.background = 'var(--gray-100)'}
                                                    onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                                                >
                                                    <FiEdit size={14} />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default OrderTimeline;
