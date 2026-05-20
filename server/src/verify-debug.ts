
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('--- DB VERIFICATION START ---');
    const user = await prisma.user.findUnique({
        where: { username: 'admin' },
    });

    if (!user) {
        console.log('User admin NOT FOUND');
        return;
    }

    console.log('User found:', {
        id: user.id,
        username: user.username,
        role: user.role,
        passwordHash: user.password
    });

    const testPassword = 'cambiarme123';
    const isMatch = await bcrypt.compare(testPassword, user.password);
    console.log(`Checking password '${testPassword}': Match = ${isMatch}`);

    if (!isMatch) {
        console.log('Generating new hash for comparison...');
        const newHash = await bcrypt.hash(testPassword, 10);
        console.log('New hash sample:', newHash);
    }
    console.log('--- DB VERIFICATION END ---');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
