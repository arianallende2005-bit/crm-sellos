import React from 'react';
import styles from './StatusBadge.module.css';
import { FiPackage, FiEdit, FiTool, FiCheckCircle, FiSend, FiFileText, FiLayers, FiShield } from 'react-icons/fi';

const StatusBadge = ({ status }) => {
    const statusConfig = {
        ingresado: {
            label: 'Ingresado',
            color: 'info',
            icon: FiFileText,
        },
        diseno_realizado: {
            label: 'Diseño',
            color: 'info',
            icon: FiEdit,
        },
        preprensa: {
            label: 'Preprensa',
            color: 'primary',
            icon: FiLayers,
        },
        procesado_fotopolimero: {
            label: 'Fotopolímero',
            color: 'primary',
            icon: FiTool,
        },
        montaje: {
            label: 'Montaje',
            color: 'warning',
            icon: FiPackage,
        },
        correcion: {
            label: 'Control de Calidad',
            color: 'warning',
            icon: FiShield,
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

    const config = statusConfig[status] || statusConfig.ingresado;
    const Icon = config.icon;

    return (
        <span className={`${styles.badge} ${styles[config.color]}`}>
            <Icon size={14} />
            {config.label}
        </span>
    );
};

export default StatusBadge;
