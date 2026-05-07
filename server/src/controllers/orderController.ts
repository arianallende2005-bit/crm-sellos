import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';

interface AuthRequest extends Request {
    user?: any;
}

export const createOrder = async (req: Request, res: Response) => {
    try {
        const { clientId, productName, imageUrl } = req.body;

        const newOrder = await prisma.order.create({
            data: {
                clientId: parseInt(clientId),
                productName,
                imageUrl,
                currentStatus: 1, // Pedido Recibido
                history: {
                    create: {
                        status: 1,
                        changedBy: (req as AuthRequest).user.id,
                        notes: 'Pedido creado',
                    },
                },
            },
            include: {
                history: true,
            }
        });

        res.status(201).json(newOrder);
    } catch (error) {
        res.status(500).json({ error: 'Error creating order' });
    }
};

export const getOrders = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        const { status, clientId, timeFilter } = req.query;

        let where: any = {};

        if (user.role === 'cliente') {
            where.clientId = user.id;
            if (req.query.archived === 'true') {
                where.isArchived = true;
            } else {
                where.isArchived = false;
            }
        } else {
            if (clientId) where.clientId = parseInt(clientId as string);
            if (status) where.currentStatus = parseInt(status as string);
            if (req.query.archived === 'true') where.isArchived = true;
            else if (req.query.archived === 'false') where.isArchived = false;
        }

        const orders = await prisma.order.findMany({
            where,
            include: {
                client: {
                    select: { username: true, fullName: true },
                },
                history: true,
            },
            orderBy: { updatedAt: 'desc' },
        });

        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching orders' });
    }
};

export const getOrderById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as AuthRequest).user;

        const order = await prisma.order.findUnique({
            where: { id: parseInt(id as string) },
            include: {
                client: { select: { id: true, username: true, fullName: true } },
                history: {
                    include: { changer: { select: { username: true } } }
                }
            },
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (user.role === 'cliente' && order.clientId !== user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching order' });
    }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        const userId = (req as AuthRequest).user.id;

        const newStatus = parseInt(status);
        if (isNaN(newStatus) || newStatus < 1 || newStatus > 5) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const updatedOrder = await prisma.$transaction(async (tx) => {
            const order = await tx.order.update({
                where: { id: parseInt(id as string) },
                data: {
                    currentStatus: newStatus,
                },
            });

            await tx.orderHistory.create({
                data: {
                    orderId: order.id,
                    status: newStatus,
                    changedBy: userId,
                    notes: notes || `Status changed to ${newStatus}`,
                },
            });

            if (order.clientId) {
                await tx.notification.create({
                    data: {
                        userId: order.clientId,
                        orderId: order.id,
                        message: `Tu pedido "${order.productName}" ha cambiado de estado.`,
                    }
                });
            }

            return order;
        });

        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ error: 'Error updating order status' });
    }
};
