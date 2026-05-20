import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const adminPassword = await bcrypt.hash('cambiarme123', 10);

    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {
            password: adminPassword,
        },
        create: {
            username: 'admin',
            password: adminPassword,
            email: 'admin@crmsellos.com',
            fullName: 'Administrador Principal',
            role: 'admin',
            isActive: true,
        },
    });

    console.log({ admin });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
