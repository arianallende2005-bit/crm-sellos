const bcrypt = require('bcrypt');
const pool = require('../config/database');
const { saltRounds } = require('../config/auth');

async function seedOperator() {
    const client = await pool.connect();
    try {
        console.log('🔄 Seeding operator user...');
        
        // 1. Alter the ENUM type to support 'operador' dynamically if not exists
        try {
            await client.query("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'operador'");
            console.log("✅ Added 'operador' to user_role ENUM (or already exists)");
        } catch (err) {
            console.log("ℹ️ Note on altering enum:", err.message);
        }

        // 2. Hash password
        const password = 'central1610';
        const hashedPassword = await bcrypt.hash(password, saltRounds || 10);

        // 3. Insert or update operator user 'montaje'
        const query = `
            INSERT INTO users (username, password, full_name, role, is_active)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (username) DO UPDATE
            SET password = EXCLUDED.password, role = EXCLUDED.role, is_active = EXCLUDED.is_active
            RETURNING id, username, role;
        `;
        const values = [
            'montaje',
            hashedPassword,
            'Operador de Montaje',
            'operador',
            true
        ];

        const res = await client.query(query, values);
        console.log('✅ Operator user seeded successfully:', res.rows[0]);

    } catch (error) {
        console.error('❌ Error seeding operator user:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

seedOperator()
    .then(() => {
        console.log('✅ Complete');
        process.exit(0);
    })
    .catch((err) => {
        console.error('❌ Failed');
        process.exit(1);
    });
