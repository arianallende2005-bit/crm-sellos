import React from 'react';
import styles from './StatusBadge.module.css';
import { FiPackage, FiEdit, FiTool, FiCheckCircle, FiSend, FiFileText, FiLayers, FiShield } from 'react-icons/fi';

const StatusBadge = ({ status }) => {
    const statusConfig = {
        diseno_realizado: {
            label: 'Diseño',
            color: 'cyan',
            icon: FiEdit,
        },
        preprensa: {
            label: 'Preprensa',
            color: 'magenta',
            icon: FiLayers,
        },
        procesado_fotopolimero: {
            label: 'Fotopolímero',
            color: 'yellow',
            icon: FiTool,
        },
        montaje: {
            label: 'Montaje/Control',
            color: 'orange',
            icon: FiPackage,
        },
        listo_entrega: {
            label: 'Remito',
            color: 'gray',
            icon: FiCheckCircle,
        },
        entregado: {
            label: 'Entregado',
            color: 'green',
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
