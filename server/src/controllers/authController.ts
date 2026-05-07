import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';

export const login = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;
        console.log('---------------------------------------------------');
        console.log('LOGIN HIT');
        console.log('Body:', req.body);
        console.log('Login attempt:', { username, passwordProvided: !!password });

        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            console.log('User not found:', username);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match:', isMatch);

        if (!isMatch) {
            console.log('Password mismatch for user:', username);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.isActive) {
            return res.status(403).json({ error: 'User is inactive' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET as string,
            { expiresIn: '24h' }
        );

        res.json({
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                fullName: user.fullName,
            },
            token,
        });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
};
