import React from 'react';
import styles from './StatusBadge.module.css';
import { FiPackage, FiEdit, FiTool, FiCheckCircle, FiSend } from 'react-icons/fi';

const StatusBadge = ({ status }) => {
    const statusConfig = {
        diseno_realizado: {
            label: 'Diseño realizado',
            color: 'info',
            icon: FiEdit,
        },
        procesado_fotopolimero: {
            label: 'Procesado de fotopolimero',
            color: 'primary',
            icon: FiTool,
        },
        montaje: {
            label: 'Montaje',
            color: 'warning',
            icon: FiPackage,
        },
        correcion: {
            label: 'Corrección',
            color: 'info',
            icon: FiEdit,
        },
        listo_entrega: {
            label: 'Remito',
            color: 'success',
            icon: FiCheckCircle,
        },
        entregado: {
            label: 'Entregado',
            color: 'success',
            icon: FiSend,
        },
    };

    const config = statusConfig[status] || statusConfig.diseno_realizado;
    const Icon = config.icon;

    return (
        <span className={`${styles.badge} ${styles[config.color]}`}>
            <Icon size={14} />
            {config.label}
        </span>
    );
};

export default StatusBadge;
