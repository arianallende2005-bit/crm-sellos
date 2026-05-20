import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import orderRoutes from './routes/orderRoutes';

const app = express();

const allowedOrigins = [
  'https://crm-fronted-qgjv.onrender.com',
  'https://centralgspro.com',
  'https://www.centralgspro.com',
  'http://localhost:5173' // Incluyo localhost para que puedas seguir probando localmente
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

export default app;
