import app from './app';
import prisma from './utils/prisma';
import bcrypt from 'bcryptjs';

const PORT = process.env.PORT || 3001;

async function seedAdmin() {
    const admin = await prisma.user.findUnique({
        where: { username: 'admin' }
    });

    if (!admin) {
        console.log('No admin user found. Creating default admin...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await prisma.user.create({
            data: {
                username: 'admin',
                password: hashedPassword,
                role: 'admin',
                fullName: 'Administrador',
                isActive: true
            }
        });
        console.log('Admin user created successfully. User: admin, Pass: admin123');
    }
}

app.listen(PORT, async () => {
    await seedAdmin();
    console.log(`Server running on port ${PORT}`);
});
