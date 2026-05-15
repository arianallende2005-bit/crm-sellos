import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import styles from './OrderTimeline.module.css';
import { FiPackage, FiEdit, FiTool, FiCheckCircle, FiSend, FiCheck } from 'react-icons/fi';

const OrderTimeline = ({ order }) => {
    const stages = [
        { key: 'diseno_realizado', label: 'Diseño realizado', icon: FiEdit },
        { key: 'procesado_fotopolimero', label: 'Procesado', icon: FiTool },
        { key: 'montaje', label: 'Montaje', icon: FiTool },
        { key: 'correcion', label: 'Corrección', icon: FiEdit },
        { key: 'listo_entrega', label: 'Listo para entrega', icon: FiCheckCircle },
    ];

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
                            {historyEntry && (
                                <div className={styles.timelineDetails}>
                                    <p className={styles.timestamp}>
                                        {format(new Date(historyEntry.changed_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                                    </p>
                                    {historyEntry.changed_by_name && (
                                        <p className={styles.changedBy}>
                                            por {historyEntry.changed_by_name}
                                        </p>
                                    )}
                                    {historyEntry.notes && (
                                        <p className={styles.notes}>{historyEntry.notes}</p>
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
