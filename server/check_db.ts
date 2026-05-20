import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking database...');
    const admin = await prisma.user.findUnique({
        where: { username: 'admin' },
    });

    if (!admin) {
        console.log('Admin user NOT FOUND');
        return;
    }

    console.log('Admin found:', admin);

    const isMatch = await bcrypt.compare('cambiarme123', admin.password);
    console.log('Password match for "cambiarme123":', isMatch);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
