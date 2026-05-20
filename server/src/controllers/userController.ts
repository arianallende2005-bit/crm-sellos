import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';

export const getClients = async (req: Request, res: Response) => {
    try {
        const clients = await prisma.user.findMany({
            where: { role: 'cliente' },
            select: {
                id: true,
                username: true,
                fullName: true,
                isActive: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(clients);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching clients' });
    }
};

export const createClient = async (req: Request, res: Response) => {
    try {
        const { username, password, fullName } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                fullName,
                role: 'cliente',
            },
        });

        res.status(201).json({
            id: newUser.id,
            username: newUser.username,
            fullName: newUser.fullName,
        });
    } catch (error) {
        res.status(500).json({ error: 'Error creating client' });
    }
};

export const updateClient = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { fullName } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id as string) },
            data: { fullName },
        });

        res.json({
            id: updatedUser.id,
            username: updatedUser.username,
            fullName: updatedUser.fullName,
        });
    } catch (error) {
        res.status(500).json({ error: 'Error updating client' });
    }
};

export const toggleClientStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id as string) },
            data: { isActive },
        });

        res.json({ message: `Client ${updatedUser.isActive ? 'activated' : 'deactivated'}` });
    } catch (error) {
        res.status(500).json({ error: 'Error modifying client status' });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: parseInt(id as string) },
            data: { password: hashedPassword },
        });

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error resetting password' });
    }
};
